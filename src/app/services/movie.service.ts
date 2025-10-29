import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';

export interface Movie {
  movieId: number;
  movieTitle: string;
  duration: string;
  genre: string;
  poster: string;
  releaseDate: string;
  movieStatus: string;
}

export interface AddMovie {
  movieTitle: string;
  duration: number;
  genre: string;
  poster: string;
  releaseDate: string;
  movieStatus: string;
}

@Injectable({ providedIn: 'root' })
export class MovieService {
  constructor(private http: HttpClient) {}
  private apiUrl = 'http://localhost:8080/api';

  getMovies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${this.apiUrl}/movies`);
  }

  getMovieById(movieId: number): Observable<Movie> {
    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('User not authenticated'));
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    const url = `${this.apiUrl}/movies/${movieId}`;
    // console.log('Fetching movie from:', url); // Log to verify URL
    return this.http.get<Movie>(url, { headers }).pipe(
      catchError((error) => {
        console.error(`Error fetching movie ${movieId}:`, {
          status: error.status,
          message: error.message,
          details: error,
        });
        return throwError(() => error);
      })
    );
  }

  addMovie(movie: AddMovie): Observable<Movie> {
    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('User not authenticated'));
    }
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http
      .post<Movie>(`${this.apiUrl}/movies`, movie, { headers })
      .pipe(
        catchError((error) => {
          console.error(`Error fetching movie ${movie}:`, {
            status: error.status,
            message: error.message,
            details: error,
          });
          return throwError(() => error);
        })
      );
  }

  updateMovie(movieId: number, updatedMovie: AddMovie): Observable<Movie> {
    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('User not authenticated'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    return this.http
      .put<Movie>(`${this.apiUrl}/movies/${movieId}`, updatedMovie, { headers })
      .pipe(
        catchError((error) => {
          console.error(`Error updating movie ${movieId}:`, error);
          return throwError(() => error);
        })
      );
  }

  deleteMovie(movieId: number): Observable<void> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found - user not authenticated');
      return throwError(() => new Error('Not authenticated'));
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const url = `${this.apiUrl}/movies/${movieId}`;

    console.log('DELETE Request:', url, 'Headers:', headers); // Log URL & headers

    return this.http.delete<void>(url, { headers }).pipe(
      tap(() => console.log('Delete SUCCESS for movieId:', movieId)), // Success log
      catchError((err) => {
        console.error('FULL DELETE ERROR:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          url: url,
          error: err.error,
          tokenExists: !!token,
        });
        return throwError(() => err);
      })
    );
  }
}
