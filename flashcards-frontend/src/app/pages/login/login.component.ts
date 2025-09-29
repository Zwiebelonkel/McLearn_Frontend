import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoaderComponent } from '../loader/loader.component';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [FormsModule, CommonModule, RouterModule, LoaderComponent],
})
export class LoginComponent {
  username = '';
  password = '';
  error = false;
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
  }

  login() {
    this.isLoading = true;
    this.error = false;
    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = true;
        console.error('Login failed:', err);
      },
    });
  }
}
