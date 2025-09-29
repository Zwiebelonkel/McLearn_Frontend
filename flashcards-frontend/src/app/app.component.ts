import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'flashcards-frontend';

  authService = inject(AuthService);

  // Observable, das im Template genutzt wird
  isLoggedIn$ = computed(() => this.authService.isLoggedIn());
  username$ = computed(() => this.authService.getUsername());

  toggleTheme() {
    document.body.classList.toggle('dark-theme');
  }
}
