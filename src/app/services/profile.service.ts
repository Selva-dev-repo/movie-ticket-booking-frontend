import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

export interface User {
  userId: number;
  userName: string;
  password: string;
  role: 'admin' | 'user';
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getUser(userId: number): Observable<User> {
    // console.log(`Fetching user with ID: ${userId}`);
    return this.http.get<User>(`${this.apiUrl}/users/${userId}`).pipe(
      catchError((error: any) => {
        console.error(`Error fetching user with ID ${userId}:`, error);
        let errorMessage = 'Failed to fetch user data';
        if (error.status === 404) {
          errorMessage = `User not found for ID: ${userId}`;
        } else if (error.status === 400) {
          errorMessage = `Invalid user data: ${error.error}`;
        } else if (error.status === 500) {
          errorMessage = `Server error: ${
            error.error || 'Unknown server issue'
          }`;
        } else if (error.status === 0) {
          errorMessage =
            'Network error: Unable to reach the server. Check CORS configuration or server status.';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
