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
import { NoteList } from './features/notes/note-list/note-list';
import { AboutUs } from './shared/about-us/about-us';
import { ExamList } from './features/exams/exam-list/exam-list';
import { ExamResult } from './features/exams/exam-result/exam-result';
import { ExamTake } from './features/exams/exam-take/exam-take';
import { ExamEdit } from './features/exams/exam-edit/exam-edit';
import { StudentDashboard } from './features/student/student-dashboard/student-dashboard';

export const routes: Routes = [
  { path: '', component: Loader },
  { path: 'login', component: Login },
  { path: 'signup', component: Register },
  { path: 'about-us', component: AboutUs },

  // Admin Dashboard
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard, adminGuard], // Both auth and admin required
    children: [
      { path: '', redirectTo: 'category/add', pathMatch: 'full' },
      // Categories
      { path: 'category/add', component: CategoryEdit, canActivate: [adminGuard] },
      { path: 'category/edit/:id', component: CategoryEdit, canActivate: [adminGuard] },
      // Videos
      { path: 'videos', component: VideoEdit, canActivate: [adminGuard] },
      { path: 'videos/edit/:id', component: VideoEdit, canActivate: [adminGuard] },
      // Notes
      { path: 'notes', component: NoteList },
      { path: 'notes/add', component: NoteEdit, canActivate: [adminGuard] },
      { path: 'notes/edit/:id', component: NoteEdit, canActivate: [adminGuard] },
      // Exams
      { path: 'exams', component: ExamList },
      { path: 'exams/add', component: ExamEdit, canActivate: [adminGuard] },
      { path: 'exams/edit/:id', component: ExamEdit, canActivate: [adminGuard] },
      { path: 'exams/take/:id', component: ExamTake, canActivate: [authGuard] },
      { path: 'exams/result/:id', component: ExamResult, canActivate: [authGuard] }
    ]
  },

  // Student Dashboard
  {
    path: 'student',
    component: StudentDashboard,
    canActivate: [authGuard], // Only auth required, no admin
    children: [
      { path: '', redirectTo: 'topics', pathMatch: 'full' },
      // Student routes
      { path: 'topics', component: NoteList }, // Students can view topics/notes
      { path: 'tests', component: ExamList }, // Students can view available tests
      { path: 'tests/take/:id', component: ExamTake },
      { path: 'tests/result/:id', component: ExamResult }
    ]
  },

  { path: '**', redirectTo: '' }
];
