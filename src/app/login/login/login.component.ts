import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  AuthService,
  LoginRequest,
  LoginResponse,
} from '../../services/auth.service';
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
    this.authService.getUserByUsername(this.users.userName).subscribe({
      next: (user) => {
        const userId = user.userId;
        const userName = user.userName;
        // Perform login
        this.authService
          .login({
            userName: this.users.userName,
            password: this.users.password,
          })
          .subscribe({
            next: (token) => {
              this.loginMessage = null;
              if (userId) {
                console.log('Navigating to /users with query params:', {
                  userId,
                  userName,
                });
                this.router
                  .navigate(['/home'], { queryParams: { userId, userName } })
                  .catch((err) => {
                    console.error('Navigation to users failed:', err);
                    this.loginMessage = 'Navigation error. Please try again.';
                  });
              } else {
                this.loginMessage =
                  'User ID not found for username. Please try again.';
              }
            },
            error: (err) => {
              console.error('Login error:', err);
              this.loginMessage = err.error || 'Invalid credentials';
            },
          });
      },
      error: (err) => {
        console.error('Error fetching user by username:', err);
        this.loginMessage =
          err.message || 'User not found. Please check username.';
      },
    });
  }
}
