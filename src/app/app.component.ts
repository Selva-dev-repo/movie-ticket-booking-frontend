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
  isMenuOpen = false;
  logoutModal: boolean = false;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.loggedIn = !!localStorage.getItem('token');
    }

    this.router.events.subscribe(() => {
      const url = this.router.url;
      if (url === '/' || url === ' ') {
        this.loggedIn = false;
      } else if (typeof window !== 'undefined') {
        this.loggedIn = !!localStorage.getItem('token');
      }
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  openLogoutModal(): void {
    this.logoutModal = true;
  }

  closeLogoutModal(): void {
    this.logoutModal = false;
  }

  logout(): void {
    this.logoutModal = false;
    this.authService.logout();
  }

  // logout() {
  //   if (typeof window !== 'undefined') {
  //     localStorage.removeItem('token');
  //   }
  //   this.loggedIn = false;
  //   this.router.navigate([' ']);
  // }
}
