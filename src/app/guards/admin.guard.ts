import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { map, take, switchMap, catchError } from 'rxjs/operators';
import { from, of, firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async (route, state) => {
  const auth = inject(Auth);
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // Wait for the first real auth state (not undefined)
    const currentUser = await firstValueFrom(
      user(auth).pipe(
        take(1)
      )
    );

    if (!currentUser) {
      router.navigate(['/client/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }
    
    const isAdmin = await authService.isAdmin(currentUser.uid);
    
    if (isAdmin) {
      return true;
    } else {
      router.navigate(['/']);
      return false;
    }
  } catch (error) {
    console.error('Admin guard error:', error);
    router.navigate(['/client/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }
};
