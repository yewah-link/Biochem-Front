import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isLoggedIn() && auth.isAdmin()) {
    return true; // allow access
  } else {
    // redirect non-admin users (or not logged in) to login or dashboard
    return router.parseUrl('/login');
  }
};
