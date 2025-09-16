import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Dashboard } from './features/admin/dashboard/dashboard';
import { CategoryEdit } from './features/categories/category-edit/category-edit';
import { VideoEdit } from './features/videos/video-edit/video-edit';
import { Loader } from './shared/loader/loader';
import { adminGuard } from './core/auth/admin.guard';
import { authGuard } from './core/auth/auth.guard';
import { NoteEdit } from './features/notes/note-edit/note-edit';
// 👉 You’ll need a NoteList component for viewing all notes
import { NoteList } from './features/notes/note-list/note-list';

export const routes: Routes = [
  { path: '', component: Loader },
  { path: 'login', component: Login },
  { path: 'signup', component: Register },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'category/add', pathMatch: 'full' },

      // Categories
      { path: 'category/add', component: CategoryEdit, canActivate: [adminGuard] },
      { path: 'category/edit/:id', component: CategoryEdit, canActivate: [adminGuard] },

      // Videos
      { path: 'videos', component: VideoEdit, canActivate: [adminGuard] },
      { path: 'videos/edit/:id', component: VideoEdit, canActivate: [adminGuard] },

      // Notes
      { path: 'notes/add', component: NoteEdit, canActivate: [adminGuard] },
      { path: 'notes/edit/:id', component: NoteEdit, canActivate: [adminGuard] }
    ]
  },

  { path: '**', redirectTo: '' }
];
