import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { Button } from '../../../../shared/ui/button/button';
import { MatFormField, MatLabel, MatHint, MatInput, MatError } from "@angular/material/input";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { getLastMonthDate, getTodayISO } from '../../../../shared/utils/date.utils';
import { MAT_DATE_FORMATS, MatOption } from '@angular/material/core';
import { DASHBOARD_DATE_FORMAT } from '../../../../shared/utils/date-format';
import { MatSelectModule } from '@angular/material/select';
import { ParkingService } from '../../../parking/services/parking.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-add-monthly-dialog',
  imports: [
    MatDialogContent,
    ReactiveFormsModule,
    Button,
    MatFormField,
    MatLabel,
    MatHint,
    MatDatepickerModule,
    MatInput,
    MatError,
    MatOption,
    MatSelectModule
],
  templateUrl: './add-monthly-dialog.html',
  styleUrl: './add-monthly-dialog.css',
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DASHBOARD_DATE_FORMAT },
  ]
})
export class AddMonthlyDialog {
  private dialogRef = inject(MatDialogRef<AddMonthlyDialog>)
  private fb = inject(FormBuilder);
  private parkingService = inject(ParkingService)
    
  isSubmitting = false;
  entryForm: FormGroup = this.fb.group({
    vehicleType: ['', Validators.required],
    plateNumber: ['', Validators.required]
  })

  readonly range = new FormGroup({
    start: new FormControl<Date | null>(getLastMonthDate()),
    end: new FormControl<Date | null>(new Date()),
  });

  onSubmit() {
    if (this.entryForm.invalid) return;
    this.isSubmitting = true;

    const payload = {
      ...this.entryForm.value,
      rateType: "MONTHLY",
      monthlyStart: this.range.value.start,
      monthlyEnd: this.range.value.end,
    }
    console.log(payload);

    this.parkingService.createMonthlySession(payload).pipe(
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe({
      next: (response) => {
        console.log('Parking created:', response);
        this.entryForm.reset();
      },
      error: (err) => {
        console.error(err);
      }
    })
  } 

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirmExit(): void {
    this.dialogRef.close(true);
  }
}
