import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  // Check if user is logged in
  if (!authService.isLoggedIn()) {
    toast.show('Please login to access admin panel', 'error');
    router.navigate(['/login']);
    return false;
  }

  // Check if user is admin (Luca or McLearn)
  if (authService.isAdmin()) {
    return true;
  }

  // Not admin - redirect and show error
  toast.show('Access denied. Admin only.', 'error');
  router.navigate(['/']);
  return false;
};