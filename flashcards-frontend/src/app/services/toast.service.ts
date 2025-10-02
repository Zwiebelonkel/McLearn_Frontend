import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new Subject<ToastMessage | null>();
  public toastState: Observable<ToastMessage | null> = this.toastSubject.asObservable();

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    this.toastSubject.next({ message, type });
    setTimeout(() => {
      this.hide();
    }, 3000);
  }

  hide() {
    this.toastSubject.next(null);
  }
}
