import { Component, OnInit } from '@angular/core';
import { AddMovie, Movie, MovieService } from '../../services/movie.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { HomeService, UpcomingMovies } from '../../services/home.service';

@Component({
  selector: 'app-movies',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './movies.component.html',
  styleUrl: './movies.component.css',
})
export class MoviesComponent implements OnInit {
  movies: Movie[] = [];
  upcoming: UpcomingMovies[] = [];
  loading: boolean = true;
  selectedMovie: Movie | null = null;
  userName: string = '';
  isAdmin: boolean = false;
  showAddMovieModal: boolean = false;
  newMovie: AddMovie = {
    movieTitle: '',
    duration: 0,
    genre: '',
    poster: '',
    releaseDate: '',
    movieStatus: '',
  };
  editMode: boolean = false;
  editMovieData: AddMovie = {
    movieTitle: '',
    duration: 0,
    genre: '',
    poster: '',
    releaseDate: '',
    movieStatus: '',
  };
  searchTerm: string = '';
  filteredMovies: Movie[] = [];
  error = '';

  constructor(
    private movieService: MovieService,
    private homeService: HomeService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const userName = this.authService.getUserName();
    const role = this.authService.getRole();
    if (userName && this.authService.isLoggedIn()) {
      this.userName = userName;
      this.isAdmin = role === 'Admin';
      this.releasedMovies();
    } else {
      this.authService.logout();
    }
  }

  // private fetchMovies(): void {
  //   this.movies = [];
  //   this.loading = true;
  //   this.movieService.getMovies().subscribe({
  //     next: (movies: Movie[]) => {
  //       // console.log('Successfully fetched movies:', movies);
  //       this.movies = movies;
  //       this.loading = false;
  //     },
  //     error: (error: any) => {
  //       console.error('Error fetching movies:', error);
  //       this.error = 'Unable to load movies. Please try again later.';
  //       this.loading = false;
  //     },
  //   });
  // }

  private releasedMovies(): void {
    this.loading = true;
    this.error = '';
    this.homeService.getReleasedMovies().subscribe({
      next: (movies: Movie[]) => {
        this.movies = movies;
        this.filteredMovies = movies;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error fetching released movies:', error);
        this.error = 'Failed to load released movies. Please try again.';
        this.loading = false;
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

  openAddMovieModal() {
    this.newMovie = {
      movieTitle: '',
      duration: 0,
      genre: '',
      poster: '',
      releaseDate: '',
      movieStatus: '',
    };
    this.showAddMovieModal = true;
  }

  closeAddMovieModal() {
    this.showAddMovieModal = false;
  }

  addMovie() {
    // console.log('Submitting movie:', this.newMovie);
    this.error = '';
    if (
      !this.newMovie.movieTitle ||
      !this.newMovie.duration ||
      !this.newMovie.genre
    ) {
      this.error = 'All fields are required';
      return;
    }
    this.movieService.addMovie(this.newMovie).subscribe({
      next: (savedMovie) => {
        // console.log('Movie added:', savedMovie);
        this.closeAddMovieModal();
        this.releasedMovies();
      },
      error: (error) => {
        console.error('Error adding movie:', error);
        this.error = error.error?.message || 'Failed to add movie';
      },
    });
  }

  openEditMovieModal(movie: Movie) {
    this.editMode = true;
    this.showAddMovieModal = true;
    this.newMovie = {
      movieTitle: movie.movieTitle,
      duration: Number(movie.duration),
      genre: movie.genre,
      poster: movie.poster,
      releaseDate: movie.releaseDate,
      movieStatus: movie.movieStatus,
    };
  }

  saveEditedMovie() {
    if (!this.selectedMovie) return;
    this.movieService
      .updateMovie(this.selectedMovie.movieId, this.newMovie)
      .subscribe({
        next: () => {
          this.editMode = false;
          this.closeAddMovieModal();
          this.releasedMovies();
        },
        error: (error) => {
          console.error('Error updating movie:', error);
          this.error = error.error?.message || 'Failed to update movie';
        },
      });
  }

  showMovieDetails(movie: Movie) {
    this.selectedMovie = movie;
  }

  closePopup() {
    this.selectedMovie = null;
  }

  bookTicket(movie: Movie): void {
    this.selectedMovie = null;
    console.log(`Movies: ${movie.movieId}`);
    this.router.navigate(['/theatres'], {
      queryParams: { movieId: movie.movieId, movieName: movie.movieTitle },
    });
  }
}
