import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoaderComponent } from '../loader/loader.component';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [FormsModule, CommonModule, RouterModule, LoaderComponent, TranslateModule],
})
export class LoginComponent {
  username = '';
  password = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {
  }

  login() {
    this.isLoading = true;
    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastService.show('Login successful', 'success');
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.show('Login failed. Please check your credentials.', 'error');
        console.error('Login failed:', err);
      },
    });
  }
}
