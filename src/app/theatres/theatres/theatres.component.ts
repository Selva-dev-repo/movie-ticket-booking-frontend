import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  AddTheatre,
  Theatre,
  TheatreService,
} from '../../services/theatre.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Movie, MovieService } from '../../services/movie.service';
import { BookingService, SaveBooking } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

interface Seat {
  id: number;
  label: string;
  status: 'available' | 'selected' | 'unavailable';
}

@Component({
  selector: 'app-theatres',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './theatres.component.html',
  styleUrl: './theatres.component.css',
})
export class TheatresComponent implements OnInit {
  movieId: number | null = null;
  movieName: string | null = null;
  userId: number | null = this.authService.getUserId();
  userName: string | null = null;
  theaters: Theatre[] = [];
  showModal: boolean = false;
  paymentModal: boolean = false;
  selectedTheater: Theatre | null = null;
  dates: string[] = [];
  selectedDate: string = '';
  showtimes: string[] = ['06:00', '09:30', '13:00', '16:30', '20:00', '23:30'];
  selectedShowtime: string = '';
  seats: Seat[] = [];
  selectedSeats: Seat[] = [];
  pricePerSeat = 120;
  isLoading: boolean = false;
  role: string | null = this.authService.getRole();
  showAddForm: boolean = false;
  showEditForm: boolean = false;
  editTheatreData: any = { theatreName: '', location: '', screenNumber: '' };
  selectedTheatreId: number | null = null;
  // addedTheatre: boolean = false;
  newTheatre: AddTheatre = { theatreName: '', location: '', screenNumber: '' };
  searchTerm: string = '';
  filteredTheatres: Theatre[] = [];
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,
    private authService: AuthService,
    private theaterService: TheatreService,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.role = this.authService.getRole();

    if (this.role === 'Admin') {
      this.fetchAllTheatres();
      return;
    }
    this.route.queryParams.subscribe((params) => {
      this.movieId = params['movieId'] ? Number(params['movieId']) : null;
      this.movieName = params['movieName']
        ? String(params['movieName'])
        : 'Unknown Movie';
      if (this.movieId !== null) {
        this.fetchTheatres(this.movieId, this.movieName);
        this.fetchMovieDetails(this.movieId, this.movieName);
        this.generateDates();
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

  private fetchAllTheatres(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.theaterService.getTheaters().subscribe({
      next: (data: Theatre[]) => {
        this.theaters = data;
        this.filteredTheatres = data;
        this.movieName = 'All Theatres';
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error fetching all theatres:', error);
        this.errorMessage = 'Failed to load theatres. Please try again.';
        this.isLoading = false;
      },
    });
  }

  private fetchTheatres(movieId: number, movieName: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.theaterService.getTheatersByMovie(movieId, movieName).subscribe({
      next: (data: Theatre[]) => {
        this.theaters = data;
        this.filteredTheatres = data;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error fetching theaters:', error);
        this.errorMessage = 'Failed to load theaters. Please try again.';
        this.isLoading = false;
      },
    });
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredTheatres = [...this.theaters];
    } else {
      this.filteredTheatres = this.theaters.filter(
        (theatre) =>
          theatre.theatreName.toLowerCase().includes(term) ||
          theatre.location.toLowerCase().includes(term)
      );
    }
  }

  addTheatre(): void {
    if (
      !this.newTheatre.theatreName ||
      !this.newTheatre.location ||
      !this.newTheatre.screenNumber
    ) {
      alert('Please fill all the fields before adding a theatre.');
      return;
    }

    this.theaterService.addTheatre(this.newTheatre).subscribe({
      next: (response) => {
        console.log('Theatre added successfully', response);
        alert('Theatre added successfully!');
        // this.addedTheatre = true;
        // setTimeout(() => {
        //   this.addedTheatre = false;
        // }, 5000);
        this.fetchAllTheatres();
        this.newTheatre = { theatreName: '', location: '', screenNumber: '' };
        this.closeTheatreModal();
      },
      error: (err) => {
        console.error('Error adding theatre:', err);
        alert('Failed to add theatre. Please try again.');
      },
    });
  }

  showAddTheatre() {
    this.showAddForm = true;
  }

  closeTheatreModal() {
    this.showAddForm = false;
  }

  openEditTheatre(theatre: Theatre) {
    this.selectedTheatreId = theatre.theatreId;
    this.editTheatreData = { ...theatre };
    this.showEditForm = true;
  }

  updateTheatre() {
    if (!this.selectedTheatreId) return;

    if (
      !this.editTheatreData.theatreName ||
      !this.editTheatreData.location ||
      !this.editTheatreData.screenNumber
    ) {
      alert('All fields are required!');
      return;
    }

    this.theaterService
      .updateTheatre(this.selectedTheatreId, this.editTheatreData)
      .subscribe({
        next: () => {
          alert('Theatre updated successfully!');
          if (this.role === 'Admin') this.fetchAllTheatres();
          else if (this.movieId && this.movieName)
            this.fetchTheatres(this.movieId, this.movieName);
          this.closeEditModal();
        },
        error: (err) => {
          console.error('Error updating theatre:', err);
          alert('Failed to update theatre. Please try again.');
        },
      });
  }

  closeEditModal() {
    this.showEditForm = false;
    this.selectedTheatreId = null;
    this.editTheatreData = { theatreName: '', location: '', screenNumber: '' };
  }

  // openAddedTheatre() {
  //   this.addedTheatre = true;
  // }

  // closeAddedTheatre() {
  //   this.addedTheatre = false;
  // }

  openSeatModal(theater: Theatre) {
    console.log(
      `Selected theater ${theater.theatreName} for movie ${this.movieName}`
    );
    this.selectedTheater = theater;
    this.selectedDate = '';
    this.selectedShowtime = '';
    this.seats = [];
    this.selectedSeats = [];
    this.showModal = true;
    this.errorMessage = '';
  }

  closeModal() {
    this.showModal = false;
    this.selectedSeats = [];
    this.seats = [];
    this.selectedTheater = null;
    this.selectedDate = '';
    this.selectedShowtime = '';
    this.isLoading = false;
    this.errorMessage = '';
  }

  generateDates(): void {
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const formattedDate = date.toISOString().split('T')[0];
      this.dates.push(formattedDate);
    }
  }

  selectDate(date: string): void {
    this.selectedDate = date;
    this.selectedShowtime = '';
    this.onSelectionChange();
  }

  selectShowtime(time: string): void {
    this.selectedShowtime = time;
    this.onSelectionChange();
  }

  isPastShow(time: string): boolean {
  if (!this.selectedDate) return false;

  const selected = new Date(this.selectedDate);
  const now = new Date();

  // Check if selected date is today
  const isToday =
    selected.getFullYear() === now.getFullYear() &&
    selected.getMonth() === now.getMonth() &&
    selected.getDate() === now.getDate();

  if (!isToday) return false; // future dates are always active

  // Parse "HH:mm" format
  const [hours, minutes] = time.split(':').map(Number);
  const showTime = new Date(selected);
  showTime.setHours(hours, minutes, 0, 0);

  const cutoffTime = new Date(showTime.getTime() - 15 * 60 * 1000);

  // If the showtime is before or equal to now → grey it out
  return now.getTime() >= cutoffTime.getTime();
  // return showTime.getTime() <= now.getTime();
}

  onSelectionChange(): void {
    if (
      this.selectedDate &&
      this.selectedShowtime &&
      this.selectedTheater &&
      this.movieId
    ) {
      this.isLoading = true;
      this.errorMessage = '';
      this.generateSeatMap();
    } else {
      this.seats = [];
      this.selectedSeats = [];
      this.isLoading = false;
    }
  }

  generateSeatMap() {
    const allSeatLabels = [
      'A1',
      'A2',
      'A3',
      'A4',
      'B1',
      'B2',
      'B3',
      'B4',
      'C1',
      'C2',
      'C3',
      'C4',
      'D1',
      'D2',
      'D3',
      'D4',
      'E1',
      'E2',
      'E3',
      'E4',
    ];

    if (
      this.movieId &&
      this.selectedTheater?.theatreId &&
      this.selectedDate &&
      this.selectedShowtime
    ) {
      this.isLoading = true;

      this.bookingService
        .checkSeatAvailability(
          allSeatLabels,
          this.selectedTheater.theatreId,
          this.movieId,
          this.selectedDate,
          this.selectedShowtime
        )
        .subscribe({
          next: (availability: boolean[]) => {
            this.seats = allSeatLabels.map((label, index) => ({
              id: index,
              label,
              status: availability[index] ? 'available' : 'unavailable',
            }));

            this.selectedSeats = this.seats.filter(
              (s) => s.status === 'selected'
            );
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error checking seat availability:', error);
            // fallback: all seats available
            this.seats = allSeatLabels.map((label, index) => ({
              id: index,
              label,
              status: 'available',
            }));
            this.errorMessage = 'Failed to load seat availability.';
            this.isLoading = false;
          },
        });
    } else {
      this.seats = [];
      this.selectedSeats = [];
      this.isLoading = false;
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

  isPayNowEnabled(): boolean {
    return (
      !!this.selectedDate &&
      !!this.selectedShowtime &&
      this.selectedSeats.length > 0 &&
      !!this.selectedTheater &&
      !!this.movieId &&
      this.userId !== null
    );
  }

  proceedToPayment() {
    if (this.isPayNowEnabled()) {
      const seatNumbers = this.selectedSeats
        .map((seat) => seat.label)
        .join(', ');
      const booking: SaveBooking = {
        bookingStatus: 'Confirmed',
        showDate: this.selectedDate,
        showTime: this.selectedShowtime,
        seatNumber: seatNumbers,
        amount: this.totalAmount,
        userId: this.userId!,
        movieId: this.movieId!,
        theatreId: this.selectedTheater!.theatreId,
      };
      console.log('Proceeding to payment with booking:', booking);
      this.bookingService.saveBooking(booking).subscribe({
        next: (savedBooking) => {
          console.log('Booking saved successfully:', savedBooking);
          alert(
            `Payment successful for ${this.selectedSeats.length} seats at $${this.totalAmount}.\n\nSeats: ${seatNumbers}\nMovie: ${this.movieName}\nTheater: ${this.selectedTheater?.theatreName}\nDate: ${this.selectedDate}\nShowtime: ${this.selectedShowtime}`
          );
          // this.paymentModal = true;
          this.closeModal();
        },
        error: (err) => {
          console.error('Error saving booking:', {
            status: err.status,
            message: err.error?.message || err.message,
            details: err.error,
          });
          this.errorMessage = `Failed to save booking: ${
            err.error?.message || 'Please try again.'
          }`;
          alert(this.errorMessage);
        },
      });
    } else {
      console.warn('Invalid booking data:', {
        seats: this.selectedSeats,
        theater: this.selectedTheater,
        movieId: this.movieId,
        userId: this.userId,
        date: this.selectedDate,
        showtime: this.selectedShowtime,
      });
      this.errorMessage =
        'Please select a date, showtime, seats, a theater, a movie, and ensure you are logged in.';
      alert(this.errorMessage);
    }
  }

  closePaymentModal(): void {
    this.paymentModal = false;
  }

  backToDetails(): void {
    this.router.navigate(['/movies']);
  }
}
