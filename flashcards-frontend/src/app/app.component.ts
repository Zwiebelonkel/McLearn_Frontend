import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ToastComponent } from './pages/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, ToastComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'flashcards-frontend';

  authService = inject(AuthService);
  router = inject(Router); // ✅ Router hier injecten

  isLoggedIn$ = computed(() => this.authService.isLoggedIn());
  username$ = computed(() => this.authService.getUsername());

  toggleTheme() {
    document.body.classList.toggle('dark-theme');
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
