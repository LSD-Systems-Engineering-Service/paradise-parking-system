import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';

import { finalize, interval, map, Observable, startWith } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

import { ParkingService } from '../../services/parking.service';
import { MatCheckbox, MatCheckboxChange } from "@angular/material/checkbox";
import { getTodayISO } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-parking-entry-form',
  imports: [
    CommonModule,
    DatePipe,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatInputModule,
    MatCheckbox
],
  templateUrl: './parking-entry-form.html',
  styleUrl: './parking-entry-form.css',
})

export class ParkingEntryForm {
  private fb = inject(FormBuilder);
  private parkingService = inject(ParkingService)
  
  isSubmitting = false;
  entryForm: FormGroup = this.fb.group({
    vehicleType: ['', Validators.required],
    plateNumber: ['', Validators.required],
    rateType: ['HOURLY', Validators.required],
    // discountHolderName: [''],
    // discountIdNumber: [''],
  });

  hasDiscount = false;
  isDelivery = false;

  scpwdCheck = false;
  deliveryCheck = false;

  onCheckboxChangePWD(event: MatCheckboxChange){
    this.hasDiscount = event.checked;
    
    console.log('Status', event.checked)
    if (this.hasDiscount) {
      this.deliveryCheck = true;
      // this.entryForm.get('discountHolderName')?.setValidators([Validators.required]);
      // this.entryForm.get('discountIdNumber')?.setValidators([Validators.required]);
      // this.entryForm.get('discountHolderName')?.updateValueAndValidity();
      // this.entryForm.get('discountIdNumber')?.updateValueAndValidity();
    } else {
      this.deliveryCheck = false;
      // this.entryForm.get('discountHolderName')?.clearValidators();
      // this.entryForm.get('discountIdNumber')?.clearValidators();
      // this.entryForm.patchValue({ discountHolderName: '', discountIdNumber: '' });
      // this.entryForm.get('discountHolderName')?.updateValueAndValidity();
      // this.entryForm.get('discountIdNumber')?.updateValueAndValidity();
      // console.log(this.hasDiscount)
    }
  }

  onCheckboxChangeDelivery(event: MatCheckboxChange){
    this.isDelivery = event.checked;
    console.log('Status', event.checked)
    if (this.isDelivery) {
      this.scpwdCheck = true;
      console.log("Is Delivery")
    } else {
      console.log("Is NOT Delivery")
      this.scpwdCheck = false;
    }
  }

  now$: Observable<Date> = interval(1000).pipe(
    startWith(0),
    map(() => new Date())
  );  

  onSubmit() {
    if (this.entryForm.invalid) return;
    this.isSubmitting = true;
    console.log(this.entryForm.value);

    this.parkingService.createParkingSession(this.entryForm.value, getTodayISO()).pipe(
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
    });
  }
}