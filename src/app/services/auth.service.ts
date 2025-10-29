import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { User } from './profile.service';
import { isPlatformBrowser } from '@angular/common';

interface LoginResponse {
  message: string;
  user?: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  private apiUrl = 'http://localhost:8080/api';

  login(users: { userName: string; password: string }): Observable<string> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, {
        userName: users.userName,
        password: users.password,
      })
      .pipe(
        tap((response) => {
          console.log(response);
          if (response.message === 'Login successful' && response.user && isPlatformBrowser(this.platformId)) {
            const mockToken = `mock-token-${response.user.userId}`;
            localStorage.setItem('token', mockToken);
            localStorage.setItem('userId', response.user.userId.toString());
            localStorage.setItem('userName', response.user.userName);
            localStorage.setItem('role', response.user.role || 'user');
          }
        }),
        map((response) => {
          // console.log('Login response:', response);
          return response.message; // Return message for success or failure
        })
      );
  }

  getUserProfile(userId?: number): Observable<User> {
    const id =
      userId || localStorage.getItem('token')?.replace('mock-token-', '');
    if (!id) {
      console.error('No userId or token found');
      return throwError(() => new Error('User not authenticated'));
    }
    return this.http.get<User>(`${this.apiUrl}/users/${id}`).pipe(
      tap((profile) => {
        if (profile?.userId && profile?.userName && isPlatformBrowser(this.platformId)) {
          localStorage.setItem('userId', String(profile.userId));
          localStorage.setItem('userName', profile.userName);
          localStorage.setItem('role', profile.role || 'user');
        } else {
          console.error('Invalid user profile data:', profile);
        }
      }),
      catchError((error) => {
        console.error(`Error fetching user profile for ID ${id}:`, error);
        return throwError(() => new Error('Failed to fetch user profile'));
      })
    );
  }

  getUserId(): number | null {
    if (isPlatformBrowser(this.platformId)) {
      const userId = localStorage.getItem('userId');
      return userId ? Number(userId) : null;
    }
    return null;
  }

  getUserName(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('userName');
    }
    return null;
  }

  getRole(): 'Admin' | 'User' | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('role') as 'Admin' | 'User' | null;
    }
    return null;
  }

  isLoggedIn(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('token');
    }
    return false;
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('role');
    }
    this.router.navigate(['']);
  }
}
