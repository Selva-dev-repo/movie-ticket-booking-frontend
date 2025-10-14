import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { HttpClientModule } from '@angular/common/http';

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
    this.loginMessage = null;
    const loginData = {
      userName: this.users.userName,
      password: this.users.password,
    };
    this.authService.login(loginData).subscribe({
      next: (response) => {
        this.loginMessage = response;
        if (response === 'Login successful') {
          const username =
            this.authService.getUserName() || this.users.userName;
          const role = this.authService.getRole();
          if (role === 'admin') {
            this.router.navigate(['/movies']);
          } else {
            this.router.navigate(['/home']);
          }
        } else {
          this.loginMessage = response;
        }
      },
      error: (err) => {
        console.error('Unexpected login error:', err);
        this.loginMessage = 'Unexpected error occurred';
      },
    });
  }
}
