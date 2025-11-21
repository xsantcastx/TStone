import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { firstValueFrom, filter, timeout } from 'rxjs';

export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  try {
    // Wait for Firebase Auth to initialize and emit a non-null value OR timeout after 5 seconds
    // This ensures we don't get a false negative while auth is still loading
    const currentUser = await firstValueFrom(
      user(auth).pipe(
        filter(user => user !== undefined), // Wait for actual auth state (not just initial undefined)
        timeout(5000) // Don't wait forever
      )
    );

    if (currentUser) {
      return true;
    } else {
      router.navigate(['/client/login'], { 
        queryParams: { returnUrl: state.url }
      });
      return false;
    }
  } catch (error) {
    console.error('Auth guard error:', error);
    router.navigate(['/client/login'], { 
      queryParams: { returnUrl: state.url }
    });
    return false;
  }
};
