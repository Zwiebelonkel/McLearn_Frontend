import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-page',
  template: `
    <div class="login-container">
      <button (click)="login()">Login with Google</button>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
  `]
})
export class LoginPageComponent {
  constructor(private authService: AuthService, private router: Router) { }

  login() {
    this.authService.login().then(() => {
      this.router.navigate(['/']);
    });
  }
}
