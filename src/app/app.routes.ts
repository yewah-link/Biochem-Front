import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Dashboard } from './features/admin/dashboard/dashboard';
import { CategoryEdit } from './features/categories/category-edit/category-edit';
import { VideoEdit } from './features/videos/video-edit/video-edit';
import { Loader } from './shared/loader/loader';
import { adminGuard } from './core/auth/admin.guard';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', component: Loader },
  { path: 'login', component: Login },
  { path: 'signup', component: Register },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'category/add', pathMatch: 'full' }, // default child route

      // ✅ Category routes
      { path: 'category/add', component: CategoryEdit, canActivate: [adminGuard] },
      { path: 'category/edit/:id', component: CategoryEdit, canActivate: [adminGuard] },

      // ✅ Video routes (better to separate list/edit later)
      { path: 'videos', component: VideoEdit, canActivate: [adminGuard] },
      { path: 'videos/edit/:id', component: VideoEdit, canActivate: [adminGuard] }
    ]
  },

  // Catch-all (redirect to landing)
  { path: '**', redirectTo: '' }
];
