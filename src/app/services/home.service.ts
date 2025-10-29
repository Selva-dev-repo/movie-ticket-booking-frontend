import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DisplayBooking } from './booking.service';

export interface UpcomingMovies {
  movieId: number;
  movieTitle: string;
  duration: string;
  genre: string;
  poster: string;
  releaseDate: string;
  movieStatus: string;
}

@Injectable({
  providedIn: 'root',
})
export class HomeService {
  constructor(private http: HttpClient) {}
  private apiUrl = 'http://localhost:8080/api';

  getUpcomingMovies(): Observable<UpcomingMovies[]> {
    return this.http.get<UpcomingMovies[]>(`${this.apiUrl}/movies/upcoming`);
  }

  getReleasedMovies(): Observable<UpcomingMovies[]> {
    return this.http.get<UpcomingMovies[]>(`${this.apiUrl}/movies/released`);
  }

  getTickets(): Observable<DisplayBooking[]> {
    return this.http.get<DisplayBooking[]>(`${this.apiUrl}/bookings`);
  }
}
