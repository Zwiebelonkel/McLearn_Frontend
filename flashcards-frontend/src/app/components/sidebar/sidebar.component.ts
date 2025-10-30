import { Component, inject, ElementRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { ThemeService } from '../../services/theme.service';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, CommonModule,TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  isLoggedIn$: Observable<boolean>;
  themeService = inject(ThemeService);

  constructor(
    private authService: AuthService, 
    private router: Router, 
    public elementRef: ElementRef
  ) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
  }

  login() {
    this.router.navigate(['/login']);
  }

  logout() {
    this.authService.logout();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
