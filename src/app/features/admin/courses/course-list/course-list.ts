import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CourseService, CourseDto } from '../../../../core/course.service';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-list.html',
  styleUrl: './course-list.scss'
})
export class CourseList implements OnInit {
  courses: CourseDto[] = [];
  filteredCourses: CourseDto[] = [];
  isLoading = false;
  searchQuery = '';
  selectedCategory: string = 'all';
  viewMode: 'grid' | 'list' = 'grid';

  constructor(
    private courseService: CourseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.isLoading = true;
    this.courseService.getAllCourses().subscribe({
      next: (courses: CourseDto[]) => {
        this.courses = courses;
        this.filteredCourses = courses;
        this.isLoading = false;
        console.log('Courses loaded:', courses);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading courses:', error);
        this.isLoading = false;
        if (error.status === 0) {
          alert('Cannot connect to server. Please check if the backend is running.');
        } else {
          alert(`Error loading courses: ${error.message}`);
        }
      }
    });
  }

  searchCourses(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value.toLowerCase();
    this.filterCourses();
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.filterCourses();
  }

  filterCourses() {
    this.filteredCourses = this.courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(this.searchQuery) ||
                           (course.description?.toLowerCase().includes(this.searchQuery) || false);
      
      const matchesCategory = this.selectedCategory === 'all' || 
                             course.category?.name === this.selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  createCourse() {
    this.router.navigate(['/dashboard/courses/create']);
  }

  viewCourse(courseId: number) {
    this.router.navigate(['/dashboard/courses', courseId]);
  }

  editCourse(courseId: number, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/dashboard/courses', courseId]);
  }

  deleteCourse(courseId: number, event: Event) {
    event.stopPropagation();
    
    const confirmed = confirm('Are you sure you want to delete this course?');
    if (!confirmed) return;

    this.courseService.deleteCourse(courseId).subscribe({
      next: () => {
        alert('Course deleted successfully!');
        this.loadCourses();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error deleting course:', error);
        alert(`Error deleting course: ${error.message}`);
      }
    });
  }

  getUniqueCategories(): string[] {
    const categories = this.courses
      .map(course => course.category?.name)
      .filter((name): name is string => !!name);
    return ['all', ...Array.from(new Set(categories))];
  }

  getCourseThumbnailUrl(course: CourseDto): string {
  return this.courseService.getCourseThumbnailUrl(course);
  }

  getStatusBadgeClass(course: CourseDto): string {
    return course.isPublished 
      ? 'bg-green-100 text-green-700 border-green-200' 
      : 'bg-amber-100 text-amber-700 border-amber-200';
  }

  getStatusText(course: CourseDto): string {
    return course.isPublished ? 'Published' : 'Draft';
  }
}