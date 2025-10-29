import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

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
    return this.http.post<Movie>(`${this.apiUrl}/movies`, movie, { headers }).pipe(
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
}
