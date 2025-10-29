import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ProfileService, User } from '../../services/profile.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { map } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  editForm: FormGroup;
  showModal: boolean = false;
  successMessage: string | null = null;
  activeTab: string = 'about';
  errorMessage: string | null = null;

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.editForm = this.fb.group({
      userName: ['', Validators.required],
      role: [''], 
      address: [''], 
      city: [''], 
      country: [''], 
      mobileNumber: ['', Validators.pattern(/^\d{0,15}$/)], 
      pincode: ['', Validators.pattern(/^\d{0,10}$/)], 
      state: [''], 
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        map((params) => ({
          userId: params.get('userId'),
          userName: params.get('userName'),
        }))
      )
      .subscribe({
        next: ({ userId, userName }) => {
          const parsedUserId = userId
            ? Number(userId)
            : this.authService.getUserId();
          // console.log('Using userId:', parsedUserId);
          this.loadUser(parsedUserId, userName);
        },
        error: (err) => {
          console.error('Error reading query parameters:', err);
          this.errorMessage = 'Failed to load profile. Please try again.';
          this.router.navigate(['']).catch((err) => {
            console.error('Navigation to login failed:', err);
            this.errorMessage =
              'Navigation error. Please check your routes or try again.';
          });
        },
      });
  }

  private loadUser(userId: number | null, userName: string | null): void {
    if (userId) {
      localStorage.setItem('userId', String(userId));
      if (userName && this.authService.getUserName() !== userName) {
        localStorage.setItem('userName', userName);
      }
      this.profileService.getUser(userId).subscribe({
        next: (data) => {
          // console.log('User data received:', data);
          if (data.userName || data.userId) {
            this.user = data;
            this.errorMessage = null;
            localStorage.setItem('userId', String(data.userId));
            localStorage.setItem('userName', data.userName);
            this.editForm.patchValue({
              userName: data.userName,
              role: data.role || '',
              address: data.address || '',
              city: data.city || '',
              country: data.country || '',
              mobileNumber: data.mobileNumber || '',
              pincode: data.pincode || '',
              state: data.state || '',
            }); 
            this.cdr.detectChanges(); 
          } else {
            console.error('User data missing userName or userId:', data);
            this.errorMessage = 'Invalid user data.';
          }
        },
        error: (err) => {
          console.error('Error fetching user:', err);
          this.errorMessage =
            err.message || 'Failed to load user data. Please try again.';
          this.router.navigate(['']).catch((err) => {
            console.error('Navigation to login failed:', err);
            this.errorMessage =
              'Navigation error. Please check your routes or try again.';
          });
        },
      });
    } else {
      console.error('No valid userId found in query params or AuthService');
      this.errorMessage = 'Invalid user ID. Please log in again.';
      this.router.navigate(['']).catch((err) => {
        console.error('Navigation to login failed:', err);
        this.errorMessage =
          'Navigation error. Please check your routes or try again.';
      });
    }
  }

  editProfile(): void {
    this.showModal = true;
    this.successMessage = null;
  }

  closeModal(): void {
    this.showModal = false;
    this.successMessage = null;
    if (this.user) {
      this.editForm.patchValue({
        userName: this.user.userName,
        role: this.user.role || '',
        address: this.user.address || '',
        city: this.user.city || '',
        country: this.user.country || '',
        mobileNumber: this.user.mobileNumber || '',
        pincode: this.user.pincode || '',
        state: this.user.state || '',
      });
    }
  }

  submitEdit(): void {
    if (this.editForm.valid && this.user) {
      const updatedUser: Partial<User> = {};
      const formValue = this.editForm.value;
      for (const key in formValue) {
        if (formValue[key] && formValue[key] !== (this.user as any)[key]) {
          updatedUser[key as keyof User] = formValue[key];
        }
      }

      if (formValue.userName) {
        updatedUser.userName = formValue.userName;
      }

      delete updatedUser.password;
      if (Object.keys(updatedUser).length > 0) {
        this.profileService.updateUser(this.user.userId, updatedUser).subscribe({
          next: (data) => {
            console.log("updating data", data);
            
            this.user = { ...this.user, ...data }; 
            this.showModal = false;
            this.errorMessage = null;
            this.successMessage = 'Profile updated successfully!';
            localStorage.setItem('userName', data.userName);
            this.cdr.detectChanges(); 
          },
          error: (err) => {
            console.error('Error updating user:', err);
            this.errorMessage = 'Failed to update profile. Please try again.';
          },
        });
      } else {
        this.showModal = false;
        this.successMessage = 'No changes made to the profile.';
      }
    } else {
      this.errorMessage = 'Please provide a valid username.';
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  logout(): void {
    this.authService.logout();
  }
}
