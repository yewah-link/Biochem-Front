import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';

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
  
  // Thumbnail handling
  selectedThumbnailFile: File | null = null;
  thumbnailPreview: string | null = null;

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

  onThumbnailSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        input.value = '';
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        input.value = '';
        return;
      }

      this.selectedThumbnailFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.thumbnailPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeThumbnail() {
    this.selectedThumbnailFile = null;
    this.thumbnailPreview = null;
    
    // Clear the file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
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
      estimatedHours: Number(formData.estimatedHours),
      category: {
        id: selectedCategory.id,
        name: selectedCategory.name,
        description: selectedCategory.description
      }
    };

    this.isLoading = true;

    // First create the course
    this.courseService.createCourse(courseDto).subscribe({
      next: (newCourse: CourseDto) => {
        console.log('Course created successfully:', newCourse);

        // If thumbnail is selected, upload it
        if (this.selectedThumbnailFile && newCourse.id) {
          this.uploadThumbnail(newCourse.id, newCourse);
        } else {
          // No thumbnail to upload, navigate to course detail
          this.isLoading = false;
          alert('Course created successfully!');
          this.router.navigate(['/dashboard/courses', newCourse.id]);
        }
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

  uploadThumbnail(courseId: number, course: CourseDto) {
    if (!this.selectedThumbnailFile) {
      this.isLoading = false;
      this.router.navigate(['/dashboard/courses', courseId]);
      return;
    }

    this.courseService.uploadThumbnail(courseId, this.selectedThumbnailFile).subscribe({
      next: (updatedCourse: CourseDto) => {
        console.log('Thumbnail uploaded successfully:', updatedCourse);
        this.isLoading = false;
        alert('Course created with thumbnail successfully!');
        this.router.navigate(['/dashboard/courses', courseId]);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error uploading thumbnail:', error);
        this.isLoading = false;
        
        // Course was created but thumbnail upload failed
        alert(`Course created but thumbnail upload failed: ${error.message}. You can upload a thumbnail later.`);
        this.router.navigate(['/dashboard/courses', courseId]);
      }
    });
  }

  cancel() {
    this.router.navigate(['/dashboard/courses']);
  }
}