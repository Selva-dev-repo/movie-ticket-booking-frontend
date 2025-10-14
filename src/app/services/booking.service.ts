import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { AuthService } from './auth.service';

export interface Booking {
  bookingId: number;
  bookingStatus: string;
  seatNumber: string;
  amount: number;
  movie?: {
    movieId: number;
    movieTitle: string;
    duration: number;
    showTime: string;
    id: number;
  };
  theatre?: {
    theatreId: number;
    theatreName: string;
    location: string;
    screenNumber: string;
    id: number;
  };
  user?: { userId: number; userName: string };
}

export interface SaveBooking {
  bookingStatus: string;
  seatNumber: string;
  amount: number;
  userId: number;
  movieId: number;
  theatreId: number;
}

export interface DisplayBooking extends Booking {
  movieName: string;
  theatreName: string;
  location: string;
  duration: number;
  screenNumber: string;
  showTime: string;
}

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  private apiUrl = 'http://localhost:8080/api/bookings';
  private movieUrl = 'http://localhost:8080/api/movies';
  private theatreUrl = 'http://localhost:8080/api/theatres';

  private bookingsSubject = new BehaviorSubject<Booking[]>([]);
  bookings$ = this.bookingsSubject.asObservable();

  getBookings(): Observable<Booking[]> {
    const userId = this.authService.getUserId();
    const token = localStorage.getItem('token');
    if (!userId || !token) {
      return throwError(() => new Error('User not authenticated'));
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http
      .get<Booking[]>(`${this.apiUrl}/user/${userId}`, { headers })
      .pipe(
        tap((bookings) => this.bookingsSubject.next(bookings)),
        catchError(this.handleError)
      );
  }

  saveBooking(booking: SaveBooking): Observable<Booking> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      return throwError(() => new Error('User not authenticated'));
    }
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    const url = `${this.apiUrl}?userId=${booking.userId}&movieId=${
      booking.movieId
    }&theatreId=${booking.theatreId}&bookingStatus=${encodeURIComponent(
      booking.bookingStatus
    )}&seatNumber=${encodeURIComponent(booking.seatNumber)}&amount=${
      booking.amount
    }`;
    console.log('Sending booking request to:', url);
    // console.log('Headers:', headers);
    return this.http.post<Booking>(url, {}, { headers }).pipe(
      catchError((error) => {
        console.error('Booking API error:', {
          status: error.status,
          message: error.error?.message || error.message,
          details: error.error,
        });
        return throwError(() => error);
      })
    );
  }

  refreshBookings(
    userId: number,
    movieId: number,
    theatreId: number
  ): Observable<Booking[]> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      return throwError(() => new Error('User not authenticated'));
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    const url = `${this.apiUrl}/theatre/${theatreId}`;
    // console.log('Fetching bookings theatres from:', url);
    return this.http.get<Booking[]>(url, { headers }).pipe(
      tap((bookings) => {
        // console.log('Fetched bookings:', bookings);
        this.bookingsSubject.next(bookings);
      }),
      catchError((error) => {
        console.error('Error fetching bookings:', {
          status: error.status,
          message: error.error?.message || error.message,
          details: error.error,
        });
        return throwError(() => error);
      })
    );
  }

  checkSeatAvailability(
    seats: string[],
    theatreId: number,
    movieId: number
  ): Observable<boolean> {
    return this.http.post<boolean>(
      `${this.apiUrl}/check-availability`,
      {
        seats,
        theatreId,
        movieId,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  showBookings(): Observable<DisplayBooking[]> {
    const userId = this.authService.getUserId();
    const token = localStorage.getItem('token');
    if (!userId || !token) {
      return throwError(() => new Error('User not authenticated'));
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http
      .get<Booking[]>(`${this.apiUrl}/user/${userId}`, { headers })
      .pipe(
        switchMap((bookings) =>
          forkJoin(
            bookings
              .filter((booking) => {
                const isValid =
                  booking.theatre?.theatreId != null && booking.movie != null;
                if (!isValid) {
                  console.warn(
                    'Skipping booking due to invalid data:',
                    booking
                  );
                }
                return isValid;
              })
              .map((booking) => {
                return forkJoin({
                  theatre: booking.theatre?.theatreId
                    ? this.getTheatre(booking.theatre.theatreId).pipe(
                        catchError(() => {
                          console.warn(
                            `Failed to fetch theatre for ID ${booking.theatre?.theatreId}, using fallback`
                          );
                          return of({
                            theatreName: 'N/A',
                            screenNumber: 'N/A',
                            location: 'N/A',
                          });
                        })
                      )
                    : of({
                        theatreName: 'N/A',
                        screenNumber: 'N/A',
                        location: 'N/A',
                      }),
                }).pipe(
                  map(({ theatre }) => ({
                    ...booking,
                    movieName: booking.movie?.movieTitle || 'N/A',
                    duration: booking.movie?.duration || 0,
                    showTime: booking.movie?.showTime || 'N/A',
                    theatreName: theatre.theatreName || 'N/A',
                    location: theatre.location || 'N/A',
                    screenNumber: theatre.screenNumber || 'N/A',
                  }))
                );
              })
          )
        ),
        catchError(this.handleError)
      );
  }

  private getMovie(movieId: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http
      .get<any>(`${this.movieUrl}/${movieId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  private getTheatre(theatreId: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http
      .get<any>(`${this.theatreUrl}/${theatreId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred while fetching bookings.';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}
