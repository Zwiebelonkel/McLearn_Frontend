import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AdminToggleService } from '../services/admin-toggle.service';

export const maintenanceGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const adminToggle = inject(AdminToggleService);

  // Wenn Maintenance Mode aktiv ist
  if (adminToggle.isMaintenanceModeActive()) {
    const username = auth.getUsername();
    
    // Nur Admins dürfen durch
    if (username === 'Luca' || username === 'McLearn') {
      return true;
    }
    
    // Alle anderen werden zum Login umgeleitet
    router.navigate(['/login']);
    return false;
  }

  // Wenn Maintenance Mode nicht aktiv ist, alle durchlassen
  return true;
};