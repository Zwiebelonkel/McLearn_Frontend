import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ToastComponent } from './pages/toast/toast.component';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, ToastComponent, TranslateModule],
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'flashcards-frontend';

  authService = inject(AuthService);
  router = inject(Router);
  translate = inject(TranslateService);

  isLoggedIn$ = this.authService.isLoggedIn$;
  username$ = computed(() => this.authService.getUsername());

  constructor() {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  toggleTheme() {
    document.body.classList.toggle('dark-theme');
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
