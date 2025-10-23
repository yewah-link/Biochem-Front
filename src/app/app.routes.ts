import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Dashboard } from './features/admin/dashboard/dashboard';
import { CategoryEdit } from './features/categories/category-edit/category-edit';
import { CategoryList } from './features/categories/category-list/category-list';
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

// Import your new student-learning components
import { Achievements } from './features/student/achievements/achievements';
import { ContinueLearning } from './features/student/continue-learning/continue-learning';
import { MyCourses } from './features/student/my-courses/my-courses';
import { ProgressBar } from './features/student/progress-bar/progress-bar';

export const routes: Routes = [
  { path: '', component: Loader },
  { path: 'login', component: Login },
  { path: 'signup', component: Register },
  { path: 'about-us', component: AboutUs },

  //  Admin Dashboard
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'categories', pathMatch: 'full' },
      { path: 'categories', component: CategoryList, canActivate: [adminGuard] },
      { path: 'categories/add', component: CategoryEdit, canActivate: [adminGuard] },
      { path: 'categories/edit/:id', component: CategoryEdit, canActivate: [adminGuard] },
      { path: 'videos', component: VideoEdit, canActivate: [adminGuard] },
      { path: 'videos/edit/:id', component: VideoEdit, canActivate: [adminGuard] },
      { path: 'notes', component: NoteList },
      { path: 'notes/add', component: NoteEdit, canActivate: [adminGuard] },
      { path: 'notes/edit/:id', component: NoteEdit, canActivate: [adminGuard] },
      { path: 'exams', component: ExamList },
      { path: 'exams/add', component: ExamEdit, canActivate: [adminGuard] },
      { path: 'exams/edit/:id', component: ExamEdit, canActivate: [adminGuard] },
      { path: 'exams/take/:id', component: ExamTake, canActivate: [authGuard] },
      { path: 'exams/result/:id', component: ExamResult, canActivate: [authGuard] }
    ]
  },

  //  Student Dashboard
  {
    path: 'student',
    component: StudentDashboard,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'my-courses', pathMatch: 'full' },

      // Student learning routes
      { path: 'my-courses', component: MyCourses },
      { path: 'continue-learning', component: ContinueLearning },
      { path: 'achievements', component: Achievements },
      { path: 'progress', component: ProgressBar },

      // Existing student routes
      { path: 'topics', component: NoteList },
      { path: 'tests', component: ExamList },
      { path: 'tests/take/:id', component: ExamTake },
      { path: 'tests/result/:id', component: ExamResult }
    ]
  },

  { path: '**', redirectTo: '' }
];
