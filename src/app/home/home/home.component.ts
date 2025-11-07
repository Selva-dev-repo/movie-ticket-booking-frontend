import { Component, OnInit } from '@angular/core';
import { Movie, MovieService } from '../../services/movie.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { HomeService, UpcomingMovies } from '../../services/home.service';
import { BookingService, DisplayBooking } from '../../services/booking.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
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
  searchTerm: string = '';
  filteredMovies: UpcomingMovies[] = [];
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

  // upcomingMovies() {
  //   this.homeService.getUpcomingMovies().subscribe({
  //     next: (movies) => {
  //       //console.log(movies);

  //       this.movies = movies;
  //       // console.log(movies);
  //     },
  //     error: (err) => {
  //       console.error('Error fetching movies:', err);
  //     },
  //   });
  // }

  upcomingMovies() {
    this.homeService.getUpcomingMovies().subscribe({
      next: (movies) => {
        const today = new Date();
        this.movies = movies;
        this.filteredMovies = movies;
        movies.forEach((movie) => {
          const releaseDate = new Date(movie.releaseDate);

          if (releaseDate <= today && movie.movieStatus !== 'Released') {
            const updatedMovie = {
              movieTitle: movie.movieTitle,
              duration: Number(movie.duration),
              genre: movie.genre,
              poster: movie.poster,
              releaseDate: movie.releaseDate,
              movieStatus: 'Released',
            };
            this.homeService
              .updateMovieStatus(movie.movieId, updatedMovie)
              .subscribe({
                next: () => {
                  console.log(`Updated ${movie.movieTitle} to Released`);
                },
                error: (err) => {
                  console.error(`Error updating movie ${movie.movieId}:`, err);
                },
              });
          }
        });
      },
      error: (err) => {
        console.error('Error fetching movies:', err);
      },
    });
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredMovies = this.movies;
      return;
    }

    this.filteredMovies = this.movies.filter(
      (movie) =>
        movie.movieTitle?.toLowerCase().includes(term) ||
        movie.genre?.toLowerCase().includes(term)
    );
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const validBookings = bookings.filter((b: any) => {
          const showDate = new Date(b.showDate);
          showDate.setHours(0, 0, 0, 0);
          return showDate >= today;
        });

        const sortedBooking = validBookings.sort(
          (a, b) => b.bookingId - a.bookingId
        );
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const validBookings = bookings.filter((b: any) => {
          const showDate = new Date(b.showDate);
          showDate.setHours(0, 0, 0, 0);
          return showDate >= today;
        });

        const sortedBooking = validBookings.sort(
          (a, b) => b.bookingId - a.bookingId
        );
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

  openMovieModal(movie: UpcomingMovies): void {
    console.log('Movies get: ', movie);

    this.selectedMovie = movie;
    this.openModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.openModal = false;
    this.selectedMovie = null;
  }
}
