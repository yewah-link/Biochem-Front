import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Dashboard } from './features/admin/dashboard/dashboard';
import { CategoryEdit } from './features/categories/category-edit/category-edit';
import { VideoEdit } from './features/videos/video-edit/video-edit'; // 👈 import VideoEdit
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
      { path: 'category/add', component: CategoryEdit, canActivate: [adminGuard] },
      { path: 'category/edit/:id', component: CategoryEdit, canActivate: [adminGuard] },

      // 👇 Add video routes here
      { path: 'videos', component: VideoEdit, canActivate: [adminGuard] },           // List/Edit Videos
      { path: 'videos/edit/:id', component: VideoEdit, canActivate: [adminGuard] },  // Edit specific video
    ]
  },
  { path: '**', redirectTo: '' }
];
