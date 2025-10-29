import { Component, computed, inject, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ToastComponent } from './pages/toast/toast.component';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ThemeService } from './services/theme.service';

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
  themeService = inject(ThemeService);

  isLoggedIn$ = this.authService.isLoggedIn$;
  username$ = computed(() => this.authService.getUsername());
  isSidebarOpen = false;

  @ViewChild('sidebar') sidebar!: SidebarComponent;
  @ViewChild('toggleButton') toggleButton!: ElementRef;

  constructor() {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
    this.themeService.initTheme();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = this.sidebar.elementRef.nativeElement.contains(event.target as Node) || this.toggleButton.nativeElement.contains(event.target as Node);
    if (this.isSidebarOpen && !clickedInside) {
      this.isSidebarOpen = false;
    }
  }

  logout(): void {
    this.authService.logout();
  }

  goHome() {
    this.router.navigate(['/']);
  }

  toggleSidebar(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
