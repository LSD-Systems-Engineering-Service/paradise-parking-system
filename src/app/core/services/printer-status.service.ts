import { Injectable, computed, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

import { environment } from '../../../environments/environment';

export interface PrinterStatus {
  online: boolean;
  devices: string[];
}

export interface PrintResult {
  jobId?: string;
  type: string;
  ok: boolean;
  error?: string;
  message?: string;
}

/**
 * Live link to the backend printer relay (/printers namespace).
 *
 * Connects as a status subscriber (role=client) and tracks whether an H10S
 * printer agent is currently online, plus the real outcome of each print once
 * the device acks it. The H10S agent itself dials out separately, so no ngrok.
 */
@Injectable({ providedIn: 'root' })
export class PrinterStatusService {
  private readonly socket: Socket;

  private readonly _status = signal<PrinterStatus>({ online: false, devices: [] });

  /** Latest printer status pushed from the relay. */
  readonly status = this._status.asReadonly();

  /** True when at least one H10S printer agent is connected. */
  readonly online = computed(() => this._status().online);

  /** Real print outcomes reported by the device (after it acks the job). */
  readonly printResult$ = new Subject<PrintResult>();

  constructor() {
    this.socket = io(`${environment.apiBaseUrl}/printers`, {
      auth: { role: 'client' },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    this.socket.on('printer:status', (s: PrinterStatus) => this._status.set(s));
    this.socket.on('print:result', (r: PrintResult) => this.printResult$.next(r));
    this.socket.on('disconnect', () =>
      this._status.set({ online: false, devices: [] }),
    );
  }
}
