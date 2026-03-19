import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox';
import { Button } from '../../../../shared/ui/button/button';
import { ReactiveFormsModule } from '@angular/forms';
import { formatMinutes } from '../../../../shared/utils/formatters.utils';

@Component({
  selector: 'app-exit-confirmation-dialog',
  imports: [
    MatDialogContent,
    MatCheckboxModule,
    ReactiveFormsModule,
    Button
  ],
  templateUrl: './exit-confirmation-dialog.html',
  styleUrl: './exit-confirmation-dialog.css',
})
export class ExitConfirmationDialog {
  private dialogRef = inject(MatDialogRef<ExitConfirmationDialog>);
  data = inject(MAT_DIALOG_DATA);

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirmExit(): void {
    this.dialogRef.close(true);
  }
}
