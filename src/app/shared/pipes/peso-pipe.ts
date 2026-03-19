import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'peso',
})
export class PesoPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (!value) return '₱0.00';

    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(value);
  }
}
