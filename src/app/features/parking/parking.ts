
import { Component, DestroyRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableDataSource } from '@angular/material/table';
import { CdkTableModule } from '@angular/cdk/table';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';

import { ParkingService } from './services/parking.service';
import { QueryState } from '../../core/models/graphql-response.model';
import { ParkingSession } from './models/parking-session.model';

import { Car, EllipsisVertical, LucideAngularModule, Motorbike, ScanQrCode, Truck } from 'lucide-angular';
import { PaginatedResponse } from '../../shared/types/paginated-response.type';
import { ParkingEntryForm } from "./components/parking-entry-form/parking-entry-form";
import { ExitConfirmationDialog } from './components/exit-confirmation-dialog/exit-confirmation-dialog';
import { Button } from '../../shared/ui/button/button';
import { PARKING_MESSAGES } from './constants/parking.constants';
import { getTodayISO } from '../../shared/utils/date.utils';
import { ParkingStatistics } from '../../../graphql/generated/graphql';
import { formatMinutes } from '../../shared/utils/time-format';

type SessionState = 'ACTIVE' | 'EXITED';

@Component({
  selector: 'app-parking',
  imports: [
    CdkTableModule,
    CommonModule,
    MatCardModule,
    MatInputModule,
    LucideAngularModule,
    ParkingEntryForm,
    MatDialogModule,
    RouterLink,
    Button,
    MatPaginator,
    MatMenuModule
  ],
  templateUrl: './parking.html',
  styleUrl: './parking.css',
})

export class Parking {
  readonly Car = Car;
  readonly Motorbike = Motorbike;
  readonly Truck = Truck;
  readonly ScanQrCode = ScanQrCode;
  readonly ellipsisVertical = EllipsisVertical;

  readonly ACTIVE_SESSION_COLUMNS: string[] = ['vehicleType', 'plateNumber', 'enteredAt', 'status', 'actions'] as const;
  readonly EXITED_SESSION_COLUMNS: string[] = ['vehicleType', 'plateNumber', 'enteredAt', 'exitedAt', 'duration', 'fee', 'status', 'actions'] as const;

  @ViewChild('activeSessionsPaginator') activeSessionsPaginator!: MatPaginator;
  @ViewChild('exitedSessionsPaginator') exitedSessionsPaginator!: MatPaginator;

  private parkingService = inject(ParkingService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  formatMinutes = formatMinutes;

  sessionManagers = {
    active: {
      dataSource: new MatTableDataSource<ParkingSession>([]),
      state: { loading: false, error: null } as QueryState<PaginatedResponse<ParkingSession>>,
      paginator: null as MatPaginator | null
    },
    exited: {
      dataSource: new MatTableDataSource<ParkingSession>([]),
      state: { loading: false, error: null } as QueryState<PaginatedResponse<ParkingSession>>,
      paginator: null as MatPaginator | null
    }
  };

  stats: ParkingStatistics | null = null;

  ngOnInit(): void {
    this.loadSessions('ACTIVE');
    this.loadSessions('EXITED');
    this.fetchParkingStatistics();
  }

  ngAfterViewInit() {
    this.sessionManagers.active.dataSource.paginator = this.activeSessionsPaginator;
    this.sessionManagers.exited.dataSource.paginator = this.exitedSessionsPaginator;
  }

  loadSessions(state: SessionState): void {
    const manager = state === 'ACTIVE' ? this.sessionManagers.active : this.sessionManagers.exited;
    manager.state.loading = true;
    manager.state.error = null;
    const currentDate = getTodayISO()

    this.parkingService.getParkingSessions({
      page: 1,
      limit: 10,
      parkingState: state,
      date: currentDate,
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        manager.dataSource.data = response.data;
        console.log(manager.dataSource.data)
        manager.state.loading = false;  

      },
      error: err => {
        console.error('Error loading parking sessions:', err);
        manager.state.error = err.message || 'Failed to load data';
        manager.state.loading = false;
      },
    });
  }

  fetchParkingStatistics(): void {
    const dateToday = getTodayISO()

    this.parkingService.getParkingStatistics({
      parkingState: "EXITED",
      date: dateToday
    }).valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ data }) => {
        const stats = data?.parkingStatistics;

        if (!stats) {
          this.stats = null;
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
      },
      error: (err) => {
        console.error('Error fetching parking statistics:', err);
      }
    })
  }

  exitSession(element: any): void {
    const dialogRef = this.dialog.open(ExitConfirmationDialog, {
      data: element
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      console.log("exited")
      console.log("")

      this.parkingService.exitParkingSession(element.id, getTodayISO()).subscribe({
        next: (response) => {
          this.snackBar.open(PARKING_MESSAGES.EXIT_SUCCESS, 'Close');
        },
        error: (error) => {
          console.error('Error exiting session:', error);
          this.snackBar.open(error.message, "Okay");
        }
      })
    })
  }

  handleRetryEntryPrint(sessionId: string): void {
    this.parkingService.retryPrintEntryTicket(sessionId).subscribe({
      next: (response) => {
        this.snackBar.open(PARKING_MESSAGES.PRINT_SUCCESS, 'Close');
      },
      error: (error) => {
        console.log('Print Service not available', error)
        this.snackBar.open(error.message, "Okay")
      }
    })
  }

  handleRetryExitPrint(sessionId: string): void {
    console.log(sessionId)
    this.parkingService.retryPrintExitTicket(sessionId).subscribe({
      next: (response) => {
        this.snackBar.open(PARKING_MESSAGES.PRINT_SUCCESS, 'Close');
      },
      error: (error) => {
        console.log('Print Service not available', error)
        this.snackBar.open(error.message, "Okay")
      }
    })
  }

  applyFilter(event: Event, state: SessionState): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    const dataSource = state === 'ACTIVE' 
      ? this.sessionManagers.active.dataSource 
      : this.sessionManagers.exited.dataSource;
    dataSource.filter = filterValue;
  }
}