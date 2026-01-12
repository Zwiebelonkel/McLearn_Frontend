import { Component, inject, ElementRef, Output, EventEmitter } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { ThemeService } from '../../services/theme.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, CommonModule, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Output() closed = new EventEmitter<void>();

  isLoggedIn$: Observable<boolean>;
  themeService = inject(ThemeService);

  constructor(
    private authService: AuthService,
    private router: Router,
    public elementRef: ElementRef
  ) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
  }

  closeSidebar() {
    this.closed.emit();
  }

  login() {
    this.router.navigate(['/login']);
    this.closeSidebar();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/logout']);
    this.closeSidebar();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
    this.closeSidebar();
  }
}
