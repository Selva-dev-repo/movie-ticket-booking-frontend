import { Component, OnInit } from '@angular/core';
import { Movie, MovieService } from '../../services/movie.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { HomeService, UpcomingMovies } from '../../services/home.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  movies: UpcomingMovies[] = [];
  loading = true;
  error = '';

  constructor(private homeService: HomeService, private router: Router) {}

  ngOnInit() {
    this.upcomingMovies();
    // this.releasedMovies();
  }

  upcomingMovies() {
    this.homeService.getUpcomingMovies().subscribe({
      next: (movies) => {
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
}
