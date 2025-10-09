import { Component, OnInit } from '@angular/core';
import { Movie, MovieService } from '../../services/movie.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-movies',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './movies.component.html',
  styleUrl: './movies.component.css',
})
export class MoviesComponent implements OnInit {
  movies: Movie[] = [];
  loading: boolean = true;
  selectedMovie: Movie | null = null;
  error = '';

  constructor(private movieService: MovieService, private router: Router) {}

  ngOnInit(): void {
    this.fetchMovies();
  }

  private fetchMovies(): void {
    this.movieService.getMovies().subscribe({
      next: (movies: Movie[]) => {
        // console.log('Successfully fetched movies:', movies);
        this.movies = movies;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error fetching movies:', error);
        this.error = 'Unable to load movies. Please try again later.';
        this.loading = false;
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
    this.router.navigate(['/theatres'], { queryParams: { movieId: movie.movieId, movieName: movie.movieTitle } });
  }
}
