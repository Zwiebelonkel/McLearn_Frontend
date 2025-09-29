import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoaderComponent } from '../../loader/loader.component';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [FormsModule, CommonModule, RouterModule, LoaderComponent],
})
export class RegisterComponent {
  username = '';
  password = '';
  error = false;
  errorMessage = '';
  success = false;
  isLoading = false;

  constructor(private http: HttpClient, private router: Router) {}

  register() {
    this.isLoading = true;
    this.http
      .post(
        'https://outside-between.onrender.com/api/register',
        {
          username: this.username,
          password: this.password,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
      .subscribe({
        next: () => {
          this.success = true;
          this.error = false;
          this.isLoading = false;
          this.errorMessage = '';
          this.username = '';
          this.password = '';
          setTimeout(() => this.goToLogin(), 1000);
        },
        error: (err) => {
          this.success = false;
          this.error = true;
          if (err.status === 409) {
            this.errorMessage = 'Benutzername bereits vergeben';
          } else {
            this.errorMessage = 'Registrierung fehlgeschlagen';
          }
        },
      });
  }

goToLogin() {
  this.router.navigate(['/login']);
}
}
