import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { map, take, switchMap, filter } from 'rxjs/operators';
import { from, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth state to be initialized (skip initial null/undefined)
  return user(auth).pipe(
    // Skip the initial null emission during Firebase Auth initialization
    filter(currentUser => currentUser !== undefined),
    take(1),
    switchMap(currentUser => {
      if (!currentUser) {
        router.navigate(['/client/login'], {
          queryParams: { returnUrl: state.url }
        });
        return of(false);
      }
      
      return from(authService.isAdmin(currentUser.uid)).pipe(
        map(isAdmin => {
          if (isAdmin) {
            return true;
          } else {
            router.navigate(['/']);
            return false;
          }
        })
      );
    })
  );
};
