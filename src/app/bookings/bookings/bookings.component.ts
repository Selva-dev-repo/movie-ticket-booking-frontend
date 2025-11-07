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
  selectedBookingId: number | null = null;
  loading: boolean = true;
  showModal: boolean = false;
  cancelModal: boolean = false;
  showConfirmModal: boolean = false;
  userName: string = '';
  searchTerm: string = '';
  filteredBookings: DisplayBooking[] = [];
  error: string | null = null;

  constructor(
    private bookingService: BookingService,
    private authService: AuthService,
    private router: Router
  ) {}

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
        this.filteredBookings = data;
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

  onSearch(): void {
  const term = this.searchTerm.toLowerCase().trim();

  if (!term) {
    this.filteredBookings = this.bookings;
    return;
  }

  this.filteredBookings = this.bookings.filter((booking) =>
    booking.movieName?.toLowerCase().includes(term) ||
    booking.theatreName?.toLowerCase().includes(term) ||
    booking.location?.toLowerCase().includes(term)
  );
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
      },
    });
  }

  closeModal() {
    this.showModal = false;
  }

  openConfirmModal(bookingId: number): void {
    this.selectedBookingId = bookingId;
    this.showModal = false;
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.selectedBookingId = null;
  }

  cancelTicket(): void {
    if (!this.selectedBooking) return;

    const bookingId = this.selectedBooking.bookingId;
    this.loading = true;
    this.showConfirmModal = false;
    this.error = null;

    this.bookingService.cancelBooking(bookingId).subscribe({
      next: (updatedBooking) => {
        const index = this.bookings.findIndex((b) => b.bookingId === bookingId);
        if (index !== -1) {
          this.bookings[index].bookingStatus = 'Cancelled';
        }

        if (
          this.selectedBooking &&
          this.selectedBooking.bookingId === this.selectedBookingId
        ) {
          this.selectedBooking.bookingStatus = 'Cancelled';
        }
        // this.bookingService.updateSeatStatusAfterCancel(this.selectedBooking.seatNumber).subscribe();
        this.loading = false;
        this.cancelModal = true;
        setTimeout(() => {
          this.cancelModal = false;
        }, 3000);
        // alert('Your ticket has been cancelled successfully.');
      },
      error: (err) => {
        this.error = err.message || 'Failed to cancel ticket.';
        this.loading = false;
        alert(this.error);
      },
    });
  }

  closeCancelModal(): void {
    this.cancelModal = false;
    this.selectedBookingId = null;
  }

  isPastShow(showDate: string, showTime: string): boolean {
    if (!showDate || !showTime) return false;
    const showDateTime = new Date(`${showDate}T${showTime}`);
    const now = new Date();
    return showDateTime < now;
  }

  logout(): void {
    this.bookings = [];
    this.authService.logout();
    this.router.navigate(['']);
  }
}
