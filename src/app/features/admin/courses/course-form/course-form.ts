import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router} from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

// Services
import { CourseService, CourseDto } from '../../../../core/course.service';
import { CategoryService, CategoryDto, GenericResponseV2 } from '../../../../core/category.service';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './course-form.html',
  styleUrl: './course-form.scss'
})
export class CourseForm implements OnInit {
  courseForm: FormGroup;
  categories: CategoryDto[] = [];
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private categoryService: CategoryService,
    private router: Router
  ) {
    this.courseForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      categoryId: [null, Validators.required],
      thumbnailUrl: [''],
      estimatedHours: [0, [Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.isLoading = true;
    this.categoryService.getAll().subscribe({
      next: (response: GenericResponseV2<CategoryDto[]>) => {
        if (response.status === 'SUCCESS' && response._embedded) {
          this.categories = response._embedded;
          console.log('Categories loaded:', this.categories);
        } else {
          console.error('Failed to load categories:', response.message);
          this.categories = [];
        }
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading categories:', error);
        this.isLoading = false;

        if (error.status === 0) {
          alert('Cannot connect to server. Please check if the backend is running.');
        } else {
          alert(`Error loading categories: ${error.message}`);
        }

        this.categories = [];
      }
    });
  }

  saveCourse() {
    if (!this.courseForm.valid) {
      Object.keys(this.courseForm.controls).forEach(key => {
        this.courseForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formData = this.courseForm.value;
    const selectedCategory = this.categories.find(c => c.id === Number(formData.categoryId));

    if (!selectedCategory) {
      alert('Please select a valid category');
      return;
    }

    const courseDto: CourseDto = {
      title: formData.title,
      description: formData.description,
      thumbnailUrl: formData.thumbnailUrl,
      estimatedHours: Number(formData.estimatedHours),
      category: {
        id: selectedCategory.id,
        name: selectedCategory.name,
        description: selectedCategory.description
      }
    };

    this.isLoading = true;

    this.courseService.createCourse(courseDto).subscribe({
      next: (newCourse: CourseDto) => {
        console.log('Course created successfully:', newCourse);
        this.isLoading = false;
        alert('Course created successfully!');
        this.router.navigate(['/dashboard/courses', newCourse.id]);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error creating course:', error);
        this.isLoading = false;

        if (error.status === 0) {
          alert('Cannot connect to server. Please check if the backend is running.');
        } else {
          alert(`Error creating course: ${error.message}`);
        }
      }
    });
  }

  cancel() {
    this.router.navigate(['/dashboard/courses']);
  }
}
