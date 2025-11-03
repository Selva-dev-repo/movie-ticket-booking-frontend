import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

export interface Theatre {
  theatreId: number;
  theatreName: string;
  location: string;
  screenNumber: string;
}

export interface AddTheatre {
  theatreName: string;
  location: string;
  screenNumber: string;
}

@Injectable({
  providedIn: 'root',
})
export class TheatreService {
  constructor(private http: HttpClient) {}
  private apiUrl = 'http://localhost:8080/api';

  getTheaters(): Observable<Theatre[]> {
    return this.http.get<Theatre[]>(`${this.apiUrl}/theatres`);
  }

  getTheatersByMovie(
    movieId: number,
    movieName: String
  ): Observable<Theatre[]> {
    const url = `${
      this.apiUrl
    }/theatres?movieId=${movieId}&movieName=${encodeURIComponent(movieName.toString())}`;
    return this.http.get<Theatre[]>(url).pipe(catchError(this.handleError));
  }

  addTheatre(theatre: AddTheatre): Observable<Theatre> {
    return this.http.post<Theatre>(`${this.apiUrl}/theatres`, theatre);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('API Error fetching theaters:', error);
    if (error.status === 0) {
      console.error('Backend not reachable. Using mock data.');
    }
    return throwError(
      () => new Error(`Error Code: ${error.status}\nMessage: ${error.message}`)
    );
  }
}
