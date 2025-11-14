import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { map, take, filter, timeout } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  // Wait for auth state to be initialized (skip initial null/undefined)
  return user(auth).pipe(
    // Skip the initial undefined emission during Firebase Auth initialization
    filter(currentUser => currentUser !== undefined),
    // Give Firebase Auth 5 seconds to restore the session
    timeout(5000),
    take(1),
    map(currentUser => {
      if (currentUser) {
        return true;
      } else {
        router.navigate(['/client/login'], { 
          queryParams: { returnUrl: state.url }
        });
        return false;
      }
    })
  );
};
