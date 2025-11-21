import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { take, firstValueFrom } from 'rxjs';

export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  try {
    // Wait for the first auth state
    const currentUser = await firstValueFrom(
      user(auth).pipe(take(1))
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
