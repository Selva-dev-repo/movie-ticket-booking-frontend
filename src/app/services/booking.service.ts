import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
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
import { isPlatformBrowser } from '@angular/common';

export interface Booking {
  bookingId: number;
  bookingStatus: string;
  seatNumber: string;
  showDate: string;
  showTime: string;
  amount: number;
  movie?: {
    movieId: number;
    movieTitle: string;
    duration: number;
    genre: string;
  };
  theatre?: {
    theatreId: number;
    theatreName: string;
    location: string;
    screenNumber: string;
  };
  user?: { userId: number; userName: string };
}

export interface SaveBooking {
  bookingStatus: string;
  seatNumber: string;
  showDate: string;
  showTime: string;
  amount: number;
  userId: number;
  movieId: number;
  theatreId: number;
}

export interface DisplayBooking extends Booking {
  bookingId: number;
  bookingStatus: string;
  seatNumber: string;
  showDate: string;
  showTime: string;
  amount: number;
  movieName: string;
  theatreName: string;
  location: string;
  duration: number;
  screenNumber: string;
}

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private apiUrl = 'http://localhost:8080/api/bookings';
  private movieUrl = 'http://localhost:8080/api/movies';
  private theatreUrl = 'http://localhost:8080/api/theatres';

  private bookingsSubject = new BehaviorSubject<Booking[]>([]);
  bookings$ = this.bookingsSubject.asObservable();

  // getBookings(): Observable<Booking[]> {
  //   const userId = this.authService.getUserId();
  //   if (!isPlatformBrowser(this.platformId) || !userId) {
  //     return throwError(
  //       () => new Error('User not authenticated or not in browser environment')
  //     );
  //   }
  //   const token = localStorage.getItem('token');
  //   if (!userId || !token) {
  //     return throwError(() => new Error('User not authenticated'));
  //   }
  //   const headers = new HttpHeaders({
  //     Authorization: `Bearer ${token}`,
  //   });
  //   return this.http
  //     .get<Booking[]>(`${this.apiUrl}/user/${userId}`, { headers })
  //     .pipe(
  //       tap((bookings) => this.bookingsSubject.next(bookings)),
  //       catchError(this.handleError)
  //     );
  // }

  getBookings(): Observable<Booking[]> {
    const userId = this.authService.getUserId();

    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    if (!isPlatformBrowser(this.platformId)) {
      return throwError(
        () => new Error('User not authenticated or not in browser environment')
      );
    }

    const token = localStorage.getItem('token');
    if (!token) {
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

  getBookingById(bookingId: number): Observable<DisplayBooking> {
    return this.http.get<DisplayBooking>(`${this.apiUrl}/${bookingId}`);
  }

  // cancelBooking(bookingId: number): Observable<void> {
  //   return this.http.delete<void>(`${this.apiUrl}/bookings/${bookingId}`);
  // }

  cancelBooking(bookingId: number): Observable<Booking> {
    const userId = this.authService.getUserId();
    if (!isPlatformBrowser(this.platformId) || !userId) {
      return throwError(
        () => new Error('User not authenticated or not in browser environment')
      );
    }

  const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('User not authenticated'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    // Backend endpoint to cancel a booking
    return this.http
      .put<Booking>(
        `${this.apiUrl}/${bookingId}/cancel?userId=${userId}`,
        {},
        { headers }
      )
      .pipe(
        tap(() => console.log(`Booking ${bookingId} cancelled successfully`)),
        catchError(this.handleError)
      );
}

  saveBooking(booking: SaveBooking): Observable<Booking> {
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(
        () => new Error('Cannot save booking in non-browser environment')
      );
    }
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
    )}&seatNumber=${encodeURIComponent(booking.seatNumber)}&showDate=${
      booking.showDate
    }&showTime=${booking.showTime}&amount=${booking.amount}`;
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
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(
        () => new Error('Cannot refresh bookings in non-browser environment')
      );
    }
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
    movieId: number,
    showDate: string,
    showTime: string
  ): Observable<boolean[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Not in browser'));
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('Not authenticated'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    const body = { seats, theatreId, movieId, showDate, showTime };

    return this.http
      .post<boolean[]>(`${this.apiUrl}/check-availability`, body, { headers })
      .pipe(catchError(this.handleError));
  }

  // updateSeatStatusAfterCancel(seatNumber: string) {
  //   return this.http.post(`${this.apiUrl}/update-seat-status`, { seatNumber });
  // }

  showBookings(): Observable<DisplayBooking[]> {
    const userId = this.authService.getUserId();

    if (!isPlatformBrowser(this.platformId) || !userId) {
      return of([]);
    }

    const token = isPlatformBrowser(this.platformId)
      ? localStorage.getItem('token')
      : null;

    if (!userId || !token) {
      return of([]);
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
                    genre: booking.movie?.genre || 'N/A',
                    showTime: booking.showTime || 'N/A',
                    showDate: booking.showDate || 'N/A',
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
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(
        () => new Error('Cannot fetch theatre in non-browser environment')
      );
    }
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http
      .get<any>(`${this.movieUrl}/${movieId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  private getTheatre(theatreId: number): Observable<any> {
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(
        () => new Error('Cannot fetch theatre in non-browser environment')
      );
    }
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
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}
