import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  Booking,
  BookingService,
  DisplayBooking,
} from '../../services/booking.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.css',
})
export class BookingsComponent implements OnInit {
  bookings: DisplayBooking[] = [];
  loading: boolean = true;
  userName: string = '';
  error: string | null = null;

  constructor(private bookingService: BookingService, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const userName = this.authService.getUserName();
    if (userName && this.authService.isLoggedIn()) {
      this.userName = userName;
      this.fetchBookings();
    } else {
      this.router.navigate(['']);
    }
  }

  fetchBookings(): void {
    this.bookings = [];
    this.loading = true;
    this.bookingService.showBookings().subscribe({
      next: (data) => {
        // console.log('Processed Bookings:', data);
        this.bookings = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
        if (err.message.includes('not authenticated')) {
          this.authService.logout();
          this.router.navigate(['']);
        }
      },
    });
  }

  logout(): void {
    this.bookings = []; // Clear bookings
    this.authService.logout();
    this.router.navigate(['']);
  }
}
