import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { ToastMessage, ToastService } from '../../services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ToastComponent implements OnInit, OnDestroy {
  message: ToastMessage | null = null;
  private subscription: Subscription | undefined;
  fadeOut = false;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.subscription = this.toastService.toastState.subscribe(
      (message: ToastMessage | null) => {
        this.message = message;
        this.fadeOut = false;

        if (message) {
          // Nach 3 Sekunden fadeOut starten
          timer(1500).subscribe(() => this.fadeOut = true);
          // Nach 4 Sekunden Toast verstecken (null setzen)
          timer(3000).subscribe(() => this.message = null);
        }
      }
    );
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  get toastClasses() {
    if (!this.message) {
      return 'hidden';
    }
    return `toast ${this.message.type} ${this.fadeOut ? 'fade-out' : ''}`;
  }
}
