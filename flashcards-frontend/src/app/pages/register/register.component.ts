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
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [FormsModule, CommonModule, RouterModule, LoaderComponent, TranslateModule],
})
export class RegisterComponent {
  username = '';
  password = '';
  error = false;
  success = false;
  isLoading = false;

  constructor(private authService: AuthService, private router: Router, private toastService: ToastService) {}

  register() {
    this.isLoading = true;
    this.authService.register(this.username, this.password).subscribe({
      next: () => {
        this.toastService.show('Register successful', 'success');
        this.success = true;
        this.error = false;
        this.isLoading = false;
        this.username = '';
        this.password = '';
        setTimeout(() => this.goToLogin(), 1000);
      },
      error: (err) => {
        this.isLoading = false;
        this.success = false;
        this.error = true;
        if (err.status === 409) {
          this.toastService.show('Username already taken', 'error');

        } else {
          this.toastService.show('Registration failed', 'error');

        }
      },
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
