import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ProfileService, User } from '../../services/profile.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  errorMessage: string | null = null;

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        map((params) => ({
          userId: params.get('userId'),
          userName: params.get('userName'),
        }))
      )
      .subscribe({
        next: ({ userId, userName }) => {
          console.log('Retrieved from query params:', { userId, userName });
          const parsedUserId = userId
            ? Number(userId)
            : this.authService.getUserId();
          console.log('Using userId:', parsedUserId);
          this.loadUser(parsedUserId, userName);
        },
        error: (err) => {
          console.error('Error reading query parameters:', err);
          this.errorMessage = 'Failed to load profile. Please try again.';
          this.router.navigate(['/login']).catch((err) => {
            console.error('Navigation to login failed:', err);
            this.errorMessage =
              'Navigation error. Please check your routes or try again.';
          });
        },
      });
  }

  private loadUser(userId: number | null, userName: string | null): void {
    if (userId) {
      localStorage.setItem('userId', String(userId));
      if (userName && this.authService.getUserName() !== userName) {
        localStorage.setItem('userName', userName);
      }
      this.profileService.getUser(userId).subscribe({
        next: (data) => {
          console.log('User data received:', data);
          if (!data.userName || !data.userId) {
            console.warn('User data missing userName or userId:', data);
            this.errorMessage = 'Invalid user data.';
          } else {
            this.user = data;
            this.errorMessage = null;
            // Update localStorage with fetched data
            localStorage.setItem('userId', String(data.userId));
            localStorage.setItem('userName', data.userName);
          }
        },
        error: (err) => {
          console.error('Error fetching user:', err);
          this.errorMessage =
            err.message || 'Failed to load user data. Please try again.';
          this.router.navigate(['/login']).catch((err) => {
            console.error('Navigation to login failed:', err);
            this.errorMessage =
              'Navigation error. Please check your routes or try again.';
          });
        },
      });
    } else {
      console.error('No valid userId found in query params or AuthService');
      this.errorMessage = 'Invalid user ID. Please log in again.';
      this.router.navigate(['/login']).catch((err) => {
        console.error('Navigation to login failed:', err);
        this.errorMessage =
          'Navigation error. Please check your routes or try again.';
      });
    }
  }

  editProfile(): void {
    alert('Edit Profile clicked!');
  }

  logout(): void {
    this.authService.logout();
  }
}
