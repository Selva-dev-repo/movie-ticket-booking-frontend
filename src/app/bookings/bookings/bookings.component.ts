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
  selectedBooking: DisplayBooking | null = null;
  loading: boolean = true;
  showModal: boolean = false;
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

openModal(bookingId: number): void {
    this.showModal = true;
    this.loading = true;
    this.error = null;
    this.selectedBooking = null;

    this.bookingService.getBookingById(bookingId).subscribe({
      next: (data: DisplayBooking) => {
        this.selectedBooking = {
        bookingId: data.bookingId,
        bookingStatus: data.bookingStatus,
        seatNumber: data.seatNumber,
        showDate: data.showDate,
        showTime: data.showTime,
        amount: data.amount,
        movieName: data.movie?.movieTitle ?? '',
        theatreName: data.theatre?.theatreName ?? '',
        location: data.theatre?.location ?? '',
        duration: data.movie?.duration ?? 0,
        screenNumber: data.theatre?.screenNumber ?? '',
      };
      this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to fetch booking.';
        this.loading = false;
      }
    });
  }

  closeModal() {
    this.showModal = false;
  }

  logout(): void {
    this.bookings = [];
    this.authService.logout();
    this.router.navigate(['']);
  }
}
