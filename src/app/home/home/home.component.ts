import { Component, OnInit } from '@angular/core';
import { Movie, MovieService } from '../../services/movie.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { HomeService, UpcomingMovies } from '../../services/home.service';
import { BookingService, DisplayBooking } from '../../services/booking.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  movies: UpcomingMovies[] = [];
  latestBooking: DisplayBooking | null = null;
  loading: boolean = true;
  bookingLoading: boolean = false;
  showModal: boolean = false;
  openModal: boolean = false;
  selectedMovie: UpcomingMovies | null = null;
  error: string = '';
  bookingError: string = '';

  constructor(
    private homeService: HomeService,
    private bookingService: BookingService,
    private router: Router
  ) {}

  ngOnInit() {
    this.upcomingMovies();
    // this.releasedMovies();
    this.fetchLatestBooking();
  }

  upcomingMovies() {
    this.homeService.getUpcomingMovies().subscribe({
      next: (movies) => {
        //console.log(movies);
        
        this.movies = movies;
        // console.log(movies);
      },
      error: (err) => {
        console.error('Error fetching movies:', err);
      },
    });
  }

  releasedMovies() {
    this.homeService.getReleasedMovies().subscribe({
      next: (movies) => {
        this.movies = movies;
      },
      error: (err) => {
        console.error('Error fetching released movies:', err);
      },
    });
  }

  fetchLatestBooking(): void {
    this.bookingLoading = true;
    this.bookingError = '';
    this.bookingService.showBookings().subscribe({
      next: (bookings) => {
        const sortedBooking = bookings.sort((a, b) => b.bookingId - a.bookingId);
        // const bookingConfirmed = sortedBooking.filter(b => b.bookingStatus === "Confirmed");
        // this.latestBooking =
        //   (bookings.sort((a, b) => b.bookingId - a.bookingId)[0] || null) && bookings.filter(b => b.bookingStatus === 'Confirmed');
        // console.log('Latest booking fetched:', this.latestBooking);
        // console.log("Latest fetched booking: ", sortedBooking);
        this.latestBooking = sortedBooking[0] || null;
        
        this.bookingLoading = false;
      },
      error: (err) => {
        console.error('Error fetching latest booking:', err);
        this.bookingError = 'Failed to load latest booking. Please try again.';
        this.bookingLoading = false;
      },
    });
  }

  viewTicket(): void {
    this.bookingLoading = true;
    this.showModal = true;
    this.bookingError = '';
    this.bookingService.showBookings().subscribe({
      next: (bookings) => {
        this.latestBooking =
          bookings.sort((a, b) => b.bookingId - a.bookingId)[0] || null;
        // console.log('Latest booking fetched:', this.latestBooking);
        this.bookingLoading = false;
      },
      error: (err) => {
        console.error('Error fetching latest booking:', err);
        this.bookingError = 'Failed to load latest booking. Please try again.';
        this.bookingLoading = false;
      },
    });
  }

  openMovieModal(movie: UpcomingMovies): void {
    console.log("Movies get: " ,movie);
    
    this.selectedMovie = movie; // Set the selected movie
    this.openModal = true; // Open the modal
  }

  closeModal() {
    this.showModal = false;
    this.openModal = false;
    this.selectedMovie = null; 
  }

  // closeModal() {
  //   this.showModal = false;
  // }
}
