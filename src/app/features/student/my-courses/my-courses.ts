import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Course {
  id: number;
  title: string;
  description: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'not-started';
  videoCount: number;
  duration: string;
}

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-courses.html',
  styleUrl: './my-courses.scss'
})
export class MyCourses implements OnInit {
  enrolledCourses = 0;
  completedCourses = 0;
  inProgressCourses = 0;

  courses: Course[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.calculateStats();
  }

  calculateStats(): void {
    this.enrolledCourses = this.courses.length;
    this.completedCourses = this.courses.filter(c => c.status === 'completed').length;
    this.inProgressCourses = this.courses.filter(c => c.status === 'in-progress').length;
  }

  navigateToDashboard(): void {
    this.router.navigate(['/student/dashboard']);
  }
}
