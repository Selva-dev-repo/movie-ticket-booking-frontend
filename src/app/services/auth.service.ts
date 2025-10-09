import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { User } from './profile.service';

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient, private router: Router) {}
  private apiUrl = 'http://localhost:8080/api';

  login(users: { userName: string; password: string }): Observable<string> {
    return this.http
      .post(`${this.apiUrl}/login`, users, { responseType: 'text' })
      .pipe(
        tap((token) => {
          // console.log('Login response (token):', token);
          localStorage.setItem('token', token);
          this.getUserProfile().subscribe({
            next: (profile: any) => {
              // console.log('User profile response:', profile);
              const user = Array.isArray(profile) ? profile[0] : profile;
              if (user?.userId) {
                // console.log("user gets id with id", user.userId);

                localStorage.setItem('userId', user.userId.toString());
              } else {
                console.error('No userId found in user profile:', profile);
              }
            },
            error: (err) => console.error('Error fetching user profile:', err),
          });
        })
      );
  }

  getUserProfile(userId?: number): Observable<User> {
    const id = userId || localStorage.getItem('token');
    if (!id) {
      console.error('No userId or token found');
      return throwError(() => new Error('User not authenticated'));
    }
    return this.http
      .get<User>(`${this.apiUrl}/users/${id}`, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        }),
      })
      .pipe(
        tap((profile) => {
          // console.log('User profile response:', profile);
          if (profile?.userId && profile?.userName) {
            localStorage.setItem('userId', String(profile.userId));
            localStorage.setItem('userName', profile.userName);
            // localStorage.setItem('role', profile.role);
          } else {
            console.error('Invalid user profile data:', profile);
          }
        }),
        catchError((error: any) => {
          console.error(`Error fetching user profile for ID ${id}:`, error);
          let errorMessage = 'Failed to fetch user profile';
          if (error.status === 404) {
            errorMessage = `User not found for ID: ${id}`;
          } else if (error.status === 500) {
            errorMessage = `Server error: ${
              error.error || 'Unknown server issue'
            }`;
          } else if (error.status === 0) {
            errorMessage =
              'Network error: Unable to reach the server. Check CORS configuration.';
          }
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  getUserByUsername(userName: string): Observable<User> {
    return this.http.get<User[]>(`${this.apiUrl}/users`).pipe(
      map((users) => {
        const user = users.find((u) => u.userName === userName);
        if (!user) {
          throw new Error(`User not found for username: ${userName}`);
        }
        return user;
      }),
      tap((user) => {
        // console.log('User found by username:', user);
        if (user?.userId && user?.userName) {
          localStorage.setItem('userId', String(user.userId));
          localStorage.setItem('userName', user.userName);
          // localStorage.setItem('role', user.role);
        }
      }),
      catchError((error: any) => {
        console.error(`Error fetching user by username ${userName}:`, error);
        let errorMessage = `Failed to fetch user for username: ${userName}`;
        if (error.status === 500) {
          errorMessage = `Server error: ${
            error.error || 'Unknown server issue'
          }`;
        } else if (error.status === 0) {
          errorMessage =
            'Network error: Unable to reach the server. Check CORS configuration.';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  getUserId(): number | null {
    const userId = localStorage.getItem('userId');
    // console.log('AuthService - Retrieved userId from localStorage:', userId);
    return userId ? Number(userId) : null;
  }

  getUserName(): string | null {
    const userName = localStorage.getItem('userName');
    // console.log('AuthService - Retrieved userName from localStorage:', userName);
    return userName;
  }

  getRole(): 'admin' | 'user' | null {
    const role = localStorage.getItem('role');
    console.log('AuthService - Retrieved role from localStorage:', role);
    return role as 'admin' | 'user' | null;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['']);
  }
}
