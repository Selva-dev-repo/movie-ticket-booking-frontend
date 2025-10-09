import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { MovieService } from './services/movie.service';
import { TheatreService } from './services/theatre.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, HttpClientModule],
  providers: [AuthService, MovieService, TheatreService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = "ticket-booking-app"
  loggedIn = false;

  constructor(private router: Router) {}

  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.loggedIn = !!localStorage.getItem('token');
    }

    this.router.events.subscribe(() => {
      const url = this.router.url;
      if (url === '/' || url === '/login') {
        this.loggedIn = false;
      } else if (typeof window !== 'undefined') {
        this.loggedIn = !!localStorage.getItem('token');
      }
    });
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    this.loggedIn = false;
    this.router.navigate(['/login']);
  }
}
