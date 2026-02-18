import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminToggleService {
  private api = inject(ApiService);
  
  // Signal für den Toggle-Zustand
  private maintenanceMode = signal<boolean>(false);

  constructor() {
    // Lade den initialen Zustand vom Server
    this.loadMaintenanceMode();
  }

  isMaintenanceModeActive(): boolean {
    return this.maintenanceMode();
  }

  // Lade den aktuellen Status vom Server
  loadMaintenanceMode(): void {
    this.api.getMaintenanceMode().subscribe({
      next: (response) => {
        this.maintenanceMode.set(response.maintenance_mode);
      },
      error: (err) => {
        console.error('Failed to load maintenance mode:', err);
        // Fallback auf false bei Fehler
        this.maintenanceMode.set(false);
      }
    });
  }

  // Setze den Maintenance Mode über die API
  setMaintenanceMode(active: boolean): Observable<any> {
    return this.api.setMaintenanceMode(active).pipe(
      tap(() => {
        this.maintenanceMode.set(active);
      })
    );
  }

  toggleMaintenanceMode(): Observable<any> {
    return this.setMaintenanceMode(!this.maintenanceMode());
  }

  // Getter für reactive Updates
  get maintenanceMode$() {
    return this.maintenanceMode;
  }
}