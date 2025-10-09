import { Routes } from '@angular/router';
import { LoginComponent } from './login/login/login.component';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home/home.component';
import { MoviesComponent } from './movies/movies/movies.component';
import { TheatresComponent } from './theatres/theatres/theatres.component';
import { BookingsComponent } from './bookings/bookings/bookings.component';
import { ProfileComponent } from './profile/profile/profile.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  {
    path: '',
    component: AppComponent,
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'movies', component: MoviesComponent },
      { path: 'movies/:id', component: MoviesComponent },
      { path: 'theatres', component: TheatresComponent },
      { path: 'bookings', component: BookingsComponent },
      { path: 'profile', component: ProfileComponent },
    ],
  },
];
