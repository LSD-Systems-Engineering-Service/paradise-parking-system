import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DateTime } from 'luxon';
import { Banknote, Car, Clock, LucideAngularModule, Motorbike } from 'lucide-angular';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { CdkTableModule } from '@angular/cdk/table';

import { StatCard } from "../../../../shared/components/stat-card/stat-card";
import { MatTableDataSource } from '@angular/material/table';
import { DatePipe, NgClass } from '@angular/common';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { ECharts } from 'echarts/core';
import { Button } from "../../../../shared/ui/button/button";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { AddMonthlyDialog } from '../../components/add-monthly-dialog/add-monthly-dialog';
import { ParkingService } from '../../../parking/services/parking.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PesoPipe } from '../../../../shared/pipes/peso-pipe';

@Component({
  selector: 'app-monthly-parking',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    FormsModule,
    ReactiveFormsModule,
    StatCard,
    LucideAngularModule,
    CdkTableModule,
    NgClass,
    NgxEchartsDirective,
    Button,
    MatCheckboxModule,
    DatePipe,
    PesoPipe
  ],
  templateUrl: './monthly-parking.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class MonthlyParking {
  readonly Banknote = Banknote;
  readonly Car = Car;
  readonly Clock = Clock;
  readonly Motorbike = Motorbike;

  readonly date = new FormControl(DateTime.now());
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private parkingService = inject(ParkingService);

  readonly COLUMNS: string[] = ['vehicleType', 'plateNumber', 'availedAt', 'expiresAt', 'parkingFee', 'status'] as const;
  dataSource = new MatTableDataSource<any>([]);

  ngOnInit(): void {
    this.loadMonthlyRecords();
  }

  addVehicle() {
    const dialogRef = this.dialog.open(AddMonthlyDialog);
  }

  chartInstance!: ECharts;
  option = {
    backgroundColor: '#FFF',
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'horizontal',
      left: 'left'
    },
    series: [
      {
        name: 'Vehicle Type',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 24, name: 'CAR' },
          { value: 47, name: 'MOTOR' },
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  loadMonthlyRecords() {
    this.parkingService.getMonthlySessions({
      page: 1,
      limit: 10,
      rateType: "MONTHLY"
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        console.log(response);
      },
      error: (err) => {
        console.error('Error loading monthly records:', err);
      }
    })
  }

  onChartInit(e: ECharts) {
    this.chartInstance = e;
    console.log('on chart init:', e);
  }

  
}
