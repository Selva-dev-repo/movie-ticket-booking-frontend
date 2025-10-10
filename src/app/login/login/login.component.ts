import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  users = { userName: '', password: '' };
  loginMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    this.loginMessage = null; // Reset error message
    this.authService.login({ userName: this.users.userName, password: this.users.password })
      .subscribe({
        next: (message) => {
          if (message === 'Login successful') {
            const role = this.authService.getRole();
            if (role === 'admin') {
              this.router.navigate(['/home']);
            } else {
              this.router.navigate(['/home']);
            }
          } else {
            this.loginMessage = message;
          }
        },
        error: (error) => {
          console.error('Login error:', error);
          this.loginMessage = error.message || 'An error occurred during login. Please try again.';
        }
      });
  }
}
