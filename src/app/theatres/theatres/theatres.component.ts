import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Theatre, TheatreService } from '../../services/theatre.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Movie, MovieService } from '../../services/movie.service';
import {  forkJoin } from 'rxjs';
import { BookingService, SaveBooking } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';

interface Seat {
  id: number;
  label: string;
  status: 'available' | 'selected' | 'unavailable';
}

@Component({
  selector: 'app-theatres',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './theatres.component.html',
  styleUrl: './theatres.component.css',
})
export class TheatresComponent implements OnInit {
  movieId: number | null = null;
  movieName: string | null = null;
  userId: number | null = this.authService.getUserId();
  userName: string | null = null;
  theaters: Theatre[] = [];
  showModal = false;
  selectedTheater: Theatre | null = null;
  seats: Seat[] = [];
  selectedSeats: Seat[] = [];
  pricePerSeat = 10;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,
    private authService: AuthService,
    private theaterService: TheatreService,
    private bookingService: BookingService,
    //  private userIdSubscription: Subscription
  ) {  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.movieId = params['movieId'] ? Number(params['movieId']) : null;
      this.movieName = params['movieName'] ? String(params['movieName']) : 'Unknown Movie';
      if (this.movieId !== null) {
        this.fetchTheatres(this.movieId, this.movieName);
        this.fetchMovieDetails(this.movieId, this.movieName);
      } else {
        this.errorMessage = 'No movie ID provided.';
        this.movieName = 'Unknown Movie';
        this.isLoading = false;
      }
    });
  }

  private fetchMovieDetails(movieId: number, movieName: string): void {
    this.movieService.getMovieById(movieId).subscribe({
      next: (movie: Movie) => {
        this.movieName = movieName;
      },
      error: (error: any) => {
        console.error('Error fetching movie details:', error);
        this.movieName = 'Unknown Movie';
      },
    });
  }

  private fetchTheatres(movieId: number, movieName: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.theaterService.getTheatersByMovie(movieId, movieName).subscribe({
      next: (data: Theatre[]) => {
        this.theaters = data;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error fetching theaters:', error);
        this.errorMessage = 'Failed to load theaters. Please try again.';
        this.isLoading = false;
      },
    });
  }

  selectShowtime(theatreId: number, theatreName: String): void {}

  openSeatModal(theater: Theatre) {
    console.log(
      `Selected theater ${theater.theatreName} for movie ${this.movieName}`
    );
    this.selectedTheater = theater;
    this.generateSeatMap();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedSeats = [];
    this.seats = [];
    this.selectedTheater = null;
  }

  generateSeatMap() {
    const rows = 5;
    const cols = 4;
    this.seats = [];
    if (this.movieId && this.selectedTheater?.theatreId) {
      this.bookingService.refreshBookings(this.userId!, this.movieId, this.selectedTheater.theatreId).subscribe({
        next: (bookings) => {
          const bookedSeats = bookings.map(booking => booking.seatNumber);
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              const id = row * cols + col;
              const label = String.fromCharCode(65 + row) + (col + 1);
              this.seats.push({
                id,
                label,
                status: bookedSeats.includes(label) || [2, 7, 12, 18].includes(id) ? 'unavailable' : 'available'
              });
            }
          }
        },
        error: (error) => {
          console.error('Error fetching bookings for seat map:', error);
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              const id = row * cols + col;
              const label = String.fromCharCode(65 + row) + (col + 1);
              this.seats.push({
                id,
                label,
                status: [2, 7, 12, 18].includes(id) ? 'unavailable' : 'available'
              });
            }
          }
        }
      });
    }
  }

  toggleSeat(seat: Seat) {
    if (seat.status === 'unavailable') return;
    seat.status = seat.status === 'selected' ? 'available' : 'selected';
    this.selectedSeats = this.seats.filter((s) => s.status === 'selected');
  }

  get totalAmount(): number {
    return this.selectedSeats.length * this.pricePerSeat;
  }

  proceedToPayment() {
    if (this.selectedSeats.length > 0 && this.selectedTheater && this.movieId && this.userId !== null) {
      const requests = this.selectedSeats.map(seat => {
        const booking: SaveBooking = {
          bookingStatus: 'Confirmed',
          seatNumber: seat.label,
          amount: this.pricePerSeat,
          userId: this.userId!,
          movieId: this.movieId!,
          theatreId: this.selectedTheater!.theatreId
        };
        // console.log('Creating booking with payload:', booking);
        return this.bookingService.saveBooking(booking);
      });

      forkJoin(requests).subscribe({
        next: (savedBookings) => {
          // console.log('Saved bookings:', savedBookings);
          if (this.movieId && this.selectedTheater?.theatreId) {
            this.bookingService.refreshBookings(this.userId!, this.movieId, this.selectedTheater.theatreId).subscribe({
              next: () => {
                alert(`Payment successful for ${this.selectedSeats.length} seats at $${this.totalAmount}.\n\nSeats: ${this.selectedSeats.map(s => s.label).join(', ')}\nMovie: ${this.movieName}\nTheater: ${this.selectedTheater?.theatreName}`);
                this.closeModal();
              },
              error: (error) => {
                console.error('Error refreshing bookings:', error);
                alert(`Payment successful, but failed to refresh bookings: ${error.error?.message || 'Please try again.'}`);
                this.closeModal();
              }
            });
          }
        },
        error: (err) => {
          console.error('Error saving bookings:', {
            status: err.status,
            message: err.error?.message || err.message,
            details: err.error
          });
          alert(`Failed to save booking: ${err.error?.message || 'Please try again.'}`);
        }
      });
    } else {
      alert('Please select seats, a theater, a movie, and ensure you are logged in.');
    }
  }

  backToDetails(): void {
    this.router.navigate(['/movies']);
  }
}
