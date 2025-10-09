import { Component, OnInit } from '@angular/core';
import { Movie, MovieService } from '../../services/movie.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  movies: Movie[] = [];
  loading = true;
  selectedMovie: Movie | null = null;
  error = '';

  constructor(private movieService: MovieService, private router: Router) {}

  ngOnInit() {
    this.movieService.getMovies().subscribe({
      next: (data) => {
        // console.log('Movies loaded:', data);
        this.movies = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Movie API error:', err);
        this.error = 'Failed to load movies';
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
