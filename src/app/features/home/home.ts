import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  parkingZones = [
    {
      id: 'A',
      name: 'North Terminal',
      description: 'Premium Covered',
      available: 42,
      total: 150,
      status: 'Available',
      statusClass: 'text-emerald-600',
      bgClass: 'bg-blue-100 text-blue-600'
    },
    {
      id: 'B',
      name: 'East Wing Deck',
      description: 'General Parking',
      available: 12,
      total: 300,
      status: 'Filling Fast',
      statusClass: 'text-amber-500',
      bgClass: 'bg-indigo-100 text-indigo-600'
    },
    {
      id: 'C',
      name: 'VIP Section',
      description: 'Valet Only',
      available: 0,
      total: 50,
      status: '0 Available',
      statusClass: 'text-rose-600',
      bgClass: 'bg-rose-100 text-rose-600'
    }
  ];
}
