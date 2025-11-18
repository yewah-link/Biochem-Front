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

// Import student-learning components
import { Achievements } from './features/student/achievements/achievements';
import { ProgressBar } from './features/student/progress-bar/progress-bar';
import { CourseEnrollment } from './features/student/course-enrollment/course-enrollment';
import { Learning } from './features/student/learning/learning';
import { MyCourses } from './features/student/my-courses/my-courses';

// Import course components
import { CourseDetail } from './features/admin/courses/course-detail/course-detail';
import { CourseList } from './features/admin/courses/course-list/course-list';
import { CourseForm } from './features/admin/courses/course-form/course-form';

// ✅ Import question components
import { QuestionEdit } from './features/questions/question-edit/question-edit';
import { QuestionList } from './features/questions/question-list/question-list';

export const routes: Routes = [
  { path: '', component: Loader },
  { path: 'login', component: Login },
  { path: 'signup', component: Register },
  { path: 'about-us', component: AboutUs },

  // Admin Dashboard
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard, adminGuard],
    children: [
      // Categories management routes
      { path: '', redirectTo: 'categories', pathMatch: 'full' },
      { path: 'categories', component: CategoryList },
      { path: 'categories/add', component: CategoryEdit },
      { path: 'categories/edit/:id', component: CategoryEdit },

      // Courses
      { path: 'courses', component: CourseList },
      { path: 'courses/create', component: CourseForm },
      { path: 'courses/:id', component: CourseDetail },

      // Video routes - Must be accessed with courseId query param
      { path: 'videos', component: VideoEdit },
      { path: 'videos/:id', component: VideoEdit },

      // Note routes
      { path: 'notes', component: NoteEdit },
      { path: 'notes/:id', component: NoteEdit },
      { path: 'notes-list', component: NoteList },

      // Exams
      { path: 'exams', component: ExamList },
      { path: 'exams/add', component: ExamEdit },
      { path: 'exams/edit/:id', component: ExamEdit },
      { path: 'exams/take/:id', component: ExamTake },
      { path: 'exams/result/:id', component: ExamResult },

      // Question Management Routes
      // View all questions for a specific exam
      { path: 'exams/:examId/questions', component: QuestionList },
      
      // Add new question to an exam
      { path: 'exams/:examId/questions/add', component: QuestionEdit },
      
      // Edit specific question
      { path: 'exams/:examId/questions/edit/:id', component: QuestionEdit },
      
      // Alternative: Edit questions in bulk for an exam
      { path: 'exams/:examId/questions/edit', component: QuestionEdit }
    ]
  },

  // Student Routes - Restructured for proper navigation
  {
    path: 'student',
    canActivate: [authGuard],
    children: [
      // Default redirect to dashboard
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Main student dashboard page
      { path: 'dashboard', component: StudentDashboard },

      // Student learning routes
      { path: 'course/:id/view', component: Learning },
      { path: 'achievements', component: Achievements },
      { path: 'progress', component: ProgressBar },

      // Course enrollment with courseId parameter
      { path: 'course/:id/enroll', component: CourseEnrollment },

      // Topics and tests
      { path: 'topics', component: NoteList },
      { path: 'tests', component: ExamList },
      { path: 'tests/take/:id', component: ExamTake },
      { path: 'tests/result/:id', component: ExamResult }
    ]
  },

  { path: '**', redirectTo: '' }
];