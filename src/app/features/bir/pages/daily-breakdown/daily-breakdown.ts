import { ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DateTime } from 'luxon';
import { Banknote, Car, Clock, LucideAngularModule, Motorbike, Truck } from 'lucide-angular';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { CdkTableModule } from '@angular/cdk/table';

import { StatCard } from "../../../../shared/components/stat-card/stat-card";
import { MatTableDataSource } from '@angular/material/table';
import { DatePipe, NgClass } from '@angular/common';
import { formatMinutes } from '../../../../shared/utils/time-format';
import { ParkingService } from '../../../parking/services/parking.service';
import { ParkingStatistics } from '../../../../../graphql/generated/graphql';

@Component({
  selector: 'app-daily-breakdown',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    FormsModule,
    ReactiveFormsModule,
    StatCard,
    LucideAngularModule,
    CdkTableModule,
    DatePipe,
    NgClass,
  ],
  templateUrl: './daily-breakdown.html',
})

export class BIRDailyBreakdown {
  readonly Banknote = Banknote;
  readonly Car = Car;
  readonly Clock = Clock;
  readonly Motorbike = Motorbike;
  readonly Truck = Truck;

  private parkingService = inject(ParkingService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  formatMinutes = formatMinutes;

  readonly COLUMNS: string[] = ['vehicleType', 'plateNumber', 'enteredAt', 'exitedAt', 'duration', 'fee', 'status'] as const;
  dataSource = new MatTableDataSource<any>([]);

  stats: ParkingStatistics | null = null;

  readonly date = new FormControl(DateTime.now(), { nonNullable: true });
  dateToday = this.date.value.toFormat('yyyy-MM-dd');

  ngOnInit(): void {
    this.loadSessions()
    this.fetchParkingStatistics()

    this.date.valueChanges.subscribe(() => {
      this.dateToday = this.date.value.toFormat('yyyy-MM-dd');
      this.loadSessions()
      this.fetchParkingStatistics()
    })
  }

  loadSessions(): void {
    this.parkingService.getParkingSessions({
      page: 1,
      limit: 10,
      parkingState: "EXITED",
      date: this.dateToday,
      includeInBIRReport: true
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        console.log(this.dataSource.data)
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Error loading parking sessions:', err);
      },
    });
  }

  fetchParkingStatistics(): void {
    this.parkingService.getParkingStatistics({
      parkingState: "EXITED",
      date: this.dateToday,
      includeInBIRReport: true
    }).valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ data }) => {
        const stats = data?.parkingStatistics;

        if (!stats) {
          this.stats = null;
          this.cdr.detectChanges(); 
          return;
        }

        this.stats = {
          parkedVehicles: stats.parkedVehicles ?? 0,
          parkedMotorcycles: stats.parkedMotorcycles ?? 0,
          revenueToday: stats.revenueToday ?? 0,
          currentlyParked: stats.currentlyParked ?? 0,
          totalEntriesToday: stats.totalEntriesToday ?? 0,
        };

        console.log(this.stats);
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Error fetching parking statistics:', err);
      }
    })
  }
}
