import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ToastComponent } from './pages/toast/toast.component';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastComponent, TranslateModule, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'flashcards-frontend';

  authService = inject(AuthService);
  router = inject(Router);
  translate = inject(TranslateService);

  isLoggedIn$ = this.authService.isLoggedIn$;
  username$ = computed(() => this.authService.getUsername());
  isSidebarOpen = false;

  constructor() {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  logout(): void {
    this.authService.logout();
  }

  goHome() {
    this.router.navigate(['/']);
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    console.log("Sidebar is: "+this.isSidebarOpen)
  }
}
