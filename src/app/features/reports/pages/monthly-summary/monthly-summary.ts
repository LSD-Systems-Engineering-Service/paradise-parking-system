import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MonthlyTransactionsGQL,
  MonthlyTransactionsQuery,
  RateType,
  VehicleType,
} from '../../../../../graphql/generated/graphql';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import {
  Banknote,
  Calendar,
  Car,
  Clock,
  Download,
  Eye,
  FileText,
  LucideAngularModule,
  Motorbike,
  TrendingUp,
  Truck,
} from 'lucide-angular';
import { DecimalPipe, NgClass } from '@angular/common';
import { NgxEchartsDirective } from 'ngx-echarts';
import { CdkTableModule } from '@angular/cdk/table';
import type { ECharts } from 'echarts/core';
import type { EChartsOption } from 'echarts';
import { MatTableDataSource } from '@angular/material/table';
import { DateTime } from 'luxon';
import { MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { LuxonDateAdapter, MatLuxonDateModule } from '@angular/material-luxon-adapter';
import { PesoPipe } from '../../../../shared/pipes/peso-pipe';
import { finalize } from 'rxjs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type MonthlyTransaction = MonthlyTransactionsQuery['monthlyTransactions'][number];

interface DailySummary {
  loggedDate: string;
  dayLabel: string;
  dayName: string;
  dayNumber: number;
  carAmount: number;
  motorAmount: number;
  truckAmount: number;
  carRevenue: number;
  motorRevenue: number;
  truckRevenue: number;
  hourlyRevenue: number;
  overnightRevenue: number;
  monthlyStreamRevenue: number;
  totalEntries: number;
  totalRevenue: number;
  averageTicket: number;
}

interface RevenueSlice {
  label: string;
  value: number;
  percent: number;
  barClass: string;
  textClass: string;
}

export const MONTH_YEAR_FORMATS = {
  parse: {
    dateInput: 'MMMM yyyy',
  },
  display: {
    dateInput: 'MMMM yyyy',
    monthYearLabel: 'MMMM yyyy',
    dateA11yLabel: 'MMMM yyyy',
    monthYearA11yLabel: 'MMMM yyyy',
  },
};

@Component({
  selector: 'app-monthly-summary',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    FormsModule,
    ReactiveFormsModule,
    StatCard,
    LucideAngularModule,
    CdkTableModule,
    NgxEchartsDirective,
    MatLuxonDateModule,
    DecimalPipe,
    NgClass,
    PesoPipe,
  ],
  templateUrl: './monthly-summary.html',
  styleUrl: './monthly-summary.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: DateAdapter, useClass: LuxonDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MONTH_YEAR_FORMATS },
  ],
})
export class MonthlySummary implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly monthlyTransactionsGQL = inject(MonthlyTransactionsGQL);
  private readonly amountFormatter = new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  readonly BanknoteIcon = Banknote;
  readonly CalendarIcon = Calendar;
  readonly CarIcon = Car;
  readonly ClockIcon = Clock;
  readonly MotorbikeIcon = Motorbike;
  readonly TruckIcon = Truck;
  readonly EyeIcon = Eye;
  readonly DownloadIcon = Download;
  readonly FileTextIcon = FileText;
  readonly TrendingUpIcon = TrendingUp;

  readonly selectedPeriod = signal(DateTime.now().startOf('month'));
  readonly dateControl = new FormControl(this.selectedPeriod(), { nonNullable: true });

  readonly totalRevenue = signal<number>(0);
  readonly averageDailyRevenue = signal<number>(0);
  readonly totalEntries = signal<number>(0);
  readonly transactionCount = signal<number>(0);
  readonly hourlyRevenue = signal<number>(0);
  readonly overnightRevenue = signal<number>(0);
  readonly monthlyAvailersRevenue = signal<number>(0);
  readonly carRevenue = signal<number>(0);
  readonly motorRevenue = signal<number>(0);
  readonly truckRevenue = signal<number>(0);
  readonly carEntries = signal<number>(0);
  readonly motorEntries = signal<number>(0);
  readonly truckEntries = signal<number>(0);
  readonly includedInBIRCount = signal<number>(0);
  readonly dailySummaries = signal<DailySummary[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isExportingPdf = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly lastUpdated = signal<DateTime | null>(null);

  readonly selectedMonthLabel = computed(() => this.selectedPeriod().toFormat('MMMM yyyy'));
  readonly daysWithTransactions = computed(
    () => this.dailySummaries().filter((summary) => summary.totalEntries > 0).length,
  );
  readonly quietDays = computed(
    () => this.dailySummaries().filter((summary) => summary.totalEntries === 0).length,
  );
  readonly topRevenueDay = computed(() => {
    const activeDays = this.dailySummaries().filter((summary) => summary.totalRevenue > 0);
    if (!activeDays.length) return null;

    return activeDays.reduce((best, current) =>
      current.totalRevenue > best.totalRevenue ? current : best,
    );
  });
  readonly revenueStreamSlices = computed<RevenueSlice[]>(() =>
    this.buildSlices([
      {
        label: 'Hourly',
        value: this.hourlyRevenue(),
        barClass: 'bg-emerald-500',
        textClass: 'text-emerald-700',
      },
      {
        label: 'Overnight',
        value: this.overnightRevenue(),
        barClass: 'bg-amber-500',
        textClass: 'text-amber-700',
      },
      {
        label: 'Monthly',
        value: this.monthlyAvailersRevenue(),
        barClass: 'bg-indigo-500',
        textClass: 'text-indigo-700',
      },
    ]),
  );
  readonly vehicleRevenueSlices = computed<RevenueSlice[]>(() =>
    this.buildSlices([
      {
        label: 'Cars',
        value: this.carRevenue(),
        barClass: 'bg-emerald-500',
        textClass: 'text-emerald-700',
      },
      {
        label: 'Motorcycles',
        value: this.motorRevenue(),
        barClass: 'bg-sky-500',
        textClass: 'text-sky-700',
      },
      {
        label: 'Trucks',
        value: this.truckRevenue(),
        barClass: 'bg-amber-500',
        textClass: 'text-amber-700',
      },
    ]),
  );

  vehicleChartInstance?: ECharts;
  monthlyTrendChartInstance?: ECharts;

  vehicleChartOptions: EChartsOption = this.buildVehicleChartOptions(0, 0, 0);
  monthlyTrendChartOptions: EChartsOption = this.buildMonthlyTrendChartOptions([]);

  readonly displayedColumns: string[] = [
    'loggedDate',
    'totalEntries',
    'vehicleMix',
    'revenueStreams',
    'averageTicket',
    'totalRevenue',
    'view',
  ];
  dataSource = new MatTableDataSource<DailySummary>([]);

  ngOnInit(): void {
    this.loadData();
  }

  setMonthAndYear(selected: DateTime, datepicker: any): void {
    const nextPeriod = this.selectedPeriod().set({
      year: selected.year,
      month: selected.month,
      day: 1,
    });

    this.selectedPeriod.set(nextPeriod);
    this.dateControl.setValue(nextPeriod);

    datepicker.close();
    this.loadData();
  }

  onVehicleChartInit(e: ECharts): void {
    this.vehicleChartInstance = e;
  }

  onMonthlyTrendChartInit(e: ECharts): void {
    this.monthlyTrendChartInstance = e;
  }

  openReport(row: DailySummary): void {
    console.log('open monthly report details', row);
  }

  exportToCSV(): void {
    const rows = this.dailySummaries();
    const headers = [
      'Date',
      'Entries',
      'Cars',
      'Motorcycles',
      'Trucks',
      'Hourly Revenue',
      'Overnight Revenue',
      'Monthly Revenue',
      'Average Ticket',
      'Total Revenue',
    ];
    const csvRows = rows.map((row) => [
      row.loggedDate,
      row.totalEntries,
      row.carAmount,
      row.motorAmount,
      row.truckAmount,
      this.formatReportCurrency(row.hourlyRevenue),
      this.formatReportCurrency(row.overnightRevenue),
      this.formatReportCurrency(row.monthlyStreamRevenue),
      this.formatReportCurrency(row.averageTicket),
      this.formatReportCurrency(row.totalRevenue),
    ]);

    const csv = [headers, ...csvRows]
      .map((row) => row.map((value) => this.toCsvValue(value)).join(','))
      .join('\n');

    this.downloadBlob(
      csv,
      `monthly-summary-${this.selectedPeriod().toFormat('yyyy-LL')}.csv`,
      'text/csv',
    );
  }

  exportToPDF(): void {
    this.isExportingPdf.set(true);

    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const generatedAt = DateTime.now().toFormat('MMM d, yyyy h:mm a');

      doc.setProperties({
        title: `Monthly Summary - ${this.selectedMonthLabel()}`,
        subject: 'Parking revenue and transaction summary',
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Monthly Parking Summary', 40, 42);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(85, 99, 115);
      doc.text(`Period: ${this.selectedMonthLabel()}`, 40, 62);
      doc.text(`Generated: ${generatedAt}`, 40, 78);

      autoTable(doc, {
        startY: 98,
        theme: 'plain',
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 5 },
        body: [
          ['Total Revenue', this.formatReportCurrency(this.totalRevenue())],
          ['Average Daily Revenue', this.formatReportCurrency(this.averageDailyRevenue())],
          ['Total Entries', this.totalEntries().toLocaleString()],
          ['Days With Transactions', `${this.daysWithTransactions()} days`],
          ['BIR Tagged Transactions', this.includedInBIRCount().toLocaleString()],
        ],
        columnStyles: {
          0: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 155 },
          1: { textColor: [51, 65, 85], cellWidth: 130 },
        },
        margin: { left: 40, right: 40 },
      });

      const mixStartY = this.getAutoTableFinalY(doc, 170) + 14;
      autoTable(doc, {
        startY: mixStartY,
        head: [['Revenue Stream', 'Revenue', 'Share']],
        body: this.revenueStreamSlices().map((slice) => [
          slice.label,
          this.formatReportCurrency(slice.value),
          `${slice.percent.toFixed(1)}%`,
        ]),
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 5 },
        margin: { left: 40, right: 480 },
      });

      autoTable(doc, {
        startY: mixStartY,
        head: [['Vehicle Type', 'Entries', 'Revenue', 'Share']],
        body: [
          [
            'Cars',
            this.carEntries(),
            this.formatReportCurrency(this.carRevenue()),
            this.getShareLabel(this.carRevenue()),
          ],
          [
            'Motorcycles',
            this.motorEntries(),
            this.formatReportCurrency(this.motorRevenue()),
            this.getShareLabel(this.motorRevenue()),
          ],
          [
            'Trucks',
            this.truckEntries(),
            this.formatReportCurrency(this.truckRevenue()),
            this.getShareLabel(this.truckRevenue()),
          ],
        ],
        theme: 'grid',
        headStyles: { fillColor: [14, 165, 233], textColor: 255, fontStyle: 'bold' },
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 5 },
        margin: { left: 380, right: 40 },
      });

      const tableStartY = Math.max(this.getAutoTableFinalY(doc, mixStartY), mixStartY + 92) + 18;
      autoTable(doc, {
        startY: tableStartY,
        head: [
          [
            'Date',
            'Entries',
            'Car / Motor / Truck',
            'Hourly',
            'Overnight',
            'Monthly',
            'Avg Ticket',
            'Total',
          ],
        ],
        body: this.dailySummaries().map((row) => [
          row.loggedDate,
          row.totalEntries,
          `${row.carAmount} / ${row.motorAmount} / ${row.truckAmount}`,
          this.formatReportCurrency(row.hourlyRevenue),
          this.formatReportCurrency(row.overnightRevenue),
          this.formatReportCurrency(row.monthlyStreamRevenue),
          this.formatReportCurrency(row.averageTicket),
          this.formatReportCurrency(row.totalRevenue),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 72 },
          1: { halign: 'right', cellWidth: 48 },
          2: { halign: 'center', cellWidth: 90 },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: 40, right: 40 },
      });

      this.addPdfFooters(doc);
      doc.save(`monthly-summary-${this.selectedPeriod().toFormat('yyyy-LL')}.pdf`);
    } finally {
      this.isExportingPdf.set(false);
    }
  }

  private loadData(): void {
    const selectedDate = this.selectedPeriod();
    const daysInMonth = selectedDate.daysInMonth ?? 30;
    const targetYear = selectedDate.year;
    const targetMonth = selectedDate.month;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.monthlyTransactionsGQL
      .fetch({
        variables: { year: targetYear, month: targetMonth },
        fetchPolicy: 'network-only',
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (response) => {
          const transactions = response.data?.monthlyTransactions ?? [];

          this.processTransactions(transactions, daysInMonth, selectedDate);
          this.lastUpdated.set(DateTime.now());
        },
        error: (err) => {
          console.error('Error loading monthly transactions:', err);
          this.errorMessage.set(
            'Unable to load monthly transactions. Please try a different month or refresh.',
          );
          this.resetReport();
        },
      });
  }

  private processTransactions(
    transactions: MonthlyTransaction[],
    daysInMonth: number,
    selectedDate: DateTime,
  ): void {
    const summariesAsc = Array.from({ length: daysInMonth }, (_, index) =>
      this.createDailySummary(selectedDate.set({ day: index + 1 })),
    );
    const dataByDay = new Map(summariesAsc.map((summary) => [summary.dayNumber, summary]));

    let cumulativeRevenue = 0;
    let totalCarRev = 0;
    let totalMotorRev = 0;
    let totalTruckRev = 0;
    let totalCarEntries = 0;
    let totalMotorEntries = 0;
    let totalTruckEntries = 0;
    let entries = 0;
    let totalHourlyRev = 0;
    let totalOvernightRev = 0;
    let totalMonthlyStreamRev = 0;
    let birTagged = 0;

    transactions.forEach((transaction) => {
      if (!transaction.occuranceDate) return;

      const occurDate = DateTime.fromISO(transaction.occuranceDate);
      if (!occurDate.isValid) return;

      const dayData = dataByDay.get(occurDate.day);
      if (!dayData) return;

      const fee = transaction.parkingFee ?? 0;

      if (transaction.vehicleType === VehicleType.Car) {
        dayData.carAmount++;
        dayData.carRevenue += fee;
        totalCarEntries++;
        totalCarRev += fee;
      } else if (transaction.vehicleType === VehicleType.Motorcycle) {
        dayData.motorAmount++;
        dayData.motorRevenue += fee;
        totalMotorEntries++;
        totalMotorRev += fee;
      } else if (transaction.vehicleType === VehicleType.Truck) {
        dayData.truckAmount++;
        dayData.truckRevenue += fee;
        totalTruckEntries++;
        totalTruckRev += fee;
      }

      if (transaction.rateType === RateType.Hourly) {
        dayData.hourlyRevenue += fee;
        totalHourlyRev += fee;
      } else if (transaction.rateType === RateType.Overnight) {
        dayData.overnightRevenue += fee;
        totalOvernightRev += fee;
      } else if (transaction.rateType === RateType.Monthly) {
        dayData.monthlyStreamRevenue += fee;
        totalMonthlyStreamRev += fee;
      }

      dayData.totalEntries++;
      dayData.totalRevenue += fee;

      cumulativeRevenue += fee;
      entries++;
      if (transaction.includeInBIRReport) {
        birTagged++;
      }
    });

    summariesAsc.forEach((summary) => {
      summary.averageTicket =
        summary.totalEntries > 0 ? Math.round(summary.totalRevenue / summary.totalEntries) : 0;
    });

    this.dailySummaries.set(summariesAsc);
    this.dataSource.data = [...summariesAsc].reverse();

    this.totalRevenue.set(cumulativeRevenue);
    this.averageDailyRevenue.set(Math.round(cumulativeRevenue / daysInMonth));
    this.totalEntries.set(entries);
    this.transactionCount.set(transactions.length);
    this.hourlyRevenue.set(Math.round(totalHourlyRev));
    this.overnightRevenue.set(Math.round(totalOvernightRev));
    this.monthlyAvailersRevenue.set(Math.round(totalMonthlyStreamRev));
    this.carRevenue.set(Math.round(totalCarRev));
    this.motorRevenue.set(Math.round(totalMotorRev));
    this.truckRevenue.set(Math.round(totalTruckRev));
    this.carEntries.set(totalCarEntries);
    this.motorEntries.set(totalMotorEntries);
    this.truckEntries.set(totalTruckEntries);
    this.includedInBIRCount.set(birTagged);

    this.vehicleChartOptions = this.buildVehicleChartOptions(totalCarRev, totalMotorRev, totalTruckRev);
    this.vehicleChartInstance?.setOption(this.vehicleChartOptions, true);

    this.monthlyTrendChartOptions = this.buildMonthlyTrendChartOptions(summariesAsc);
    this.monthlyTrendChartInstance?.setOption(this.monthlyTrendChartOptions, true);
  }

  private resetReport(): void {
    this.dailySummaries.set([]);
    this.dataSource.data = [];
    this.totalRevenue.set(0);
    this.averageDailyRevenue.set(0);
    this.totalEntries.set(0);
    this.transactionCount.set(0);
    this.hourlyRevenue.set(0);
    this.overnightRevenue.set(0);
    this.monthlyAvailersRevenue.set(0);
    this.carRevenue.set(0);
    this.motorRevenue.set(0);
    this.truckRevenue.set(0);
    this.carEntries.set(0);
    this.motorEntries.set(0);
    this.truckEntries.set(0);
    this.includedInBIRCount.set(0);
  }

  private createDailySummary(date: DateTime): DailySummary {
    return {
      loggedDate: date.toISODate() ?? '',
      dayLabel: date.toFormat('MMM d'),
      dayName: date.toFormat('ccc'),
      dayNumber: date.day,
      carAmount: 0,
      motorAmount: 0,
      truckAmount: 0,
      carRevenue: 0,
      motorRevenue: 0,
      truckRevenue: 0,
      hourlyRevenue: 0,
      overnightRevenue: 0,
      monthlyStreamRevenue: 0,
      totalEntries: 0,
      totalRevenue: 0,
      averageTicket: 0,
    };
  }

  private buildVehicleChartOptions(car: number, motorcycle: number, truck: number): EChartsOption {
    const total = car + motorcycle + truck;

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: (params: any) =>
          `${params.name}: ${this.formatReportCurrency(Number(params.value ?? 0))} (${params.percent}%)`,
      },
      legend: {
        orient: 'horizontal',
        left: 'left',
        bottom: 0,
      },
      color: ['#10b981', '#0ea5e9', '#f59e0b'],
      series: [
        {
          name: 'Revenue by Vehicle Type',
          type: 'pie',
          radius: ['44%', '70%'],
          center: ['50%', '48%'],
          avoidLabelOverlap: true,
          label: {
            formatter: total > 0 ? '{b}\n{d}%' : 'No revenue',
          },
          data:
            total > 0
              ? [
                  { value: Math.round(car), name: 'CAR' },
                  { value: Math.round(motorcycle), name: 'MOTORCYCLE' },
                  { value: Math.round(truck), name: 'TRUCK' },
                ]
              : [{ value: 1, name: 'No revenue', itemStyle: { color: '#e2e8f0' } }],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(15, 23, 42, 0.18)',
            },
          },
        },
      ],
    };
  }

  private buildMonthlyTrendChartOptions(summaries: DailySummary[]): EChartsOption {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (value) => this.formatReportCurrency(Number(value ?? 0)),
      },
      legend: {
        data: ['Hourly', 'Overnight', 'Monthly'],
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '4%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: summaries.map((summary) => summary.dayLabel),
        axisLabel: { interval: 1, rotate: summaries.length > 20 ? 40 : 0 },
      },
      yAxis: {
        type: 'value',
        name: 'Revenue',
        axisLabel: {
          formatter: (value: number) => this.formatCompactCurrency(value),
        },
      },
      color: ['#10b981', '#f59e0b', '#6366f1'],
      series: [
        {
          name: 'Hourly',
          type: 'bar',
          stack: 'total',
          emphasis: { focus: 'series' },
          data: summaries.map((summary) => Math.round(summary.hourlyRevenue)),
        },
        {
          name: 'Overnight',
          type: 'bar',
          stack: 'total',
          emphasis: { focus: 'series' },
          data: summaries.map((summary) => Math.round(summary.overnightRevenue)),
        },
        {
          name: 'Monthly',
          type: 'bar',
          stack: 'total',
          emphasis: { focus: 'series' },
          data: summaries.map((summary) => Math.round(summary.monthlyStreamRevenue)),
        },
      ],
    };
  }

  private buildSlices(slices: Omit<RevenueSlice, 'percent'>[]): RevenueSlice[] {
    const total = slices.reduce((sum, slice) => sum + slice.value, 0);

    return slices.map((slice) => ({
      ...slice,
      percent: total > 0 ? (slice.value / total) * 100 : 0,
    }));
  }

  private getAutoTableFinalY(doc: jsPDF, fallback: number): number {
    const table = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable;
    return table?.finalY ?? fallback;
  }

  private addPdfFooters(doc: jsPDF): void {
    const pageCount = doc.getNumberOfPages();

    for (let page = 1; page <= pageCount; page++) {
      doc.setPage(page);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Page ${page} of ${pageCount}`,
        doc.internal.pageSize.getWidth() - 88,
        doc.internal.pageSize.getHeight() - 24,
      );
      doc.text('Paradise Parking System', 40, doc.internal.pageSize.getHeight() - 24);
    }
  }

  private downloadBlob(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type: `${type};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private toCsvValue(value: string | number): string {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  private formatReportCurrency(value: number): string {
    return `PHP ${this.amountFormatter.format(value ?? 0)}`;
  }

  private formatCompactCurrency(value: number): string {
    if (Math.abs(value) >= 1_000_000) {
      return `PHP ${(value / 1_000_000).toFixed(1)}M`;
    }

    if (Math.abs(value) >= 1_000) {
      return `PHP ${(value / 1_000).toFixed(0)}K`;
    }

    return `PHP ${Math.round(value)}`;
  }

  private getShareLabel(value: number): string {
    const total = this.totalRevenue();
    if (!total) return '0.0%';

    return `${((value / total) * 100).toFixed(1)}%`;
  }
}
