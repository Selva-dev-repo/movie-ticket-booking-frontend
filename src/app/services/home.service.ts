import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface UpcomingMovies {
  movieId: number;
  movieTitle: string;
  duration: string;
  genre: string;
  posterUrl: string;
  releaseDate: string;
  movieStatus: string;
}

@Injectable({
  providedIn: 'root',
})
export class HomeService {
  constructor(private http: HttpClient) {}
  private apiUrl = 'http://localhost:8080/api/movies';

  getUpcomingMovies(): Observable<UpcomingMovies[]> {
    return this.http.get<UpcomingMovies[]>(`${this.apiUrl}/upcoming`);
  }

  getReleasedMovies(): Observable<UpcomingMovies[]> {
    return this.http.get<UpcomingMovies[]>(`${this.apiUrl}/released`);
  }
}
