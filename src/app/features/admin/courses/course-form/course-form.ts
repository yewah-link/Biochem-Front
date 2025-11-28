import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

// Services
import { CourseService, CourseDto } from '../../../../core/course.service';
import { CategoryService, CategoryDto, GenericResponseV2 } from '../../../../core/category.service';
import { CoursePriceService, CoursePriceRequest } from '../../../../core/course-price.service';

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

  // Pricing mode
  pricingMode: 'free' | 'immediate' | 'scheduled' = 'free';

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private categoryService: CategoryService,
    private coursePriceService: CoursePriceService,
    private router: Router
  ) {
    this.courseForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      categoryId: [null, Validators.required],
      estimatedHours: [0, [Validators.min(0)]],
      
      // Pricing fields
      price: [0, [Validators.min(0)]],
      priceActivationDate: ['']
    });
  }

  ngOnInit() {
    this.loadCategories();
    this.setupPricingValidation();
  }

  loadCategories() {
    this.isLoading = true;
    this.categoryService.getAll().subscribe({
      next: (response: GenericResponseV2<CategoryDto[]>) => {
        if (response.status === 'SUCCESS' && response._embedded) {
          this.categories = response._embedded;
        } else {
          this.categories = [];
        }
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading categories:', error);
        this.isLoading = false;
        this.categories = [];
        
        if (error.status === 0) {
          alert('Cannot connect to server. Please check if the backend is running.');
        } else {
          alert(`Error loading categories: ${error.message}`);
        }
      }
    });
  }

  // Handle pricing mode changes
  setPricingMode(mode: 'free' | 'immediate' | 'scheduled') {
    this.pricingMode = mode;
    this.setupPricingValidation();
  }

  // Setup validators based on pricing mode
  setupPricingValidation() {
    const priceControl = this.courseForm.get('price');
    const activationControl = this.courseForm.get('priceActivationDate');

    if (this.pricingMode === 'free') {
      priceControl?.clearValidators();
      activationControl?.clearValidators();
      priceControl?.setValue(0);
      activationControl?.setValue('');
    } else if (this.pricingMode === 'immediate') {
      priceControl?.setValidators([Validators.required, Validators.min(0.01)]);
      activationControl?.clearValidators();
      activationControl?.setValue('');
    } else if (this.pricingMode === 'scheduled') {
      priceControl?.setValidators([Validators.required, Validators.min(0.01)]);
      activationControl?.setValidators([Validators.required]);
    }

    priceControl?.updateValueAndValidity();
    activationControl?.updateValueAndValidity();
  }

  onThumbnailSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        input.value = '';
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        input.value = '';
        return;
      }

      this.selectedThumbnailFile = file;

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

    // Create course first
    this.courseService.createCourse(courseDto).subscribe({
      next: (newCourse: CourseDto) => {
        console.log('Course created successfully:', newCourse);

        // Handle thumbnail and pricing
        if (newCourse.id) {
          this.handlePostCreation(newCourse.id, newCourse);
        } else {
          this.isLoading = false;
          alert('Course created but missing ID');
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

  // Handle thumbnail upload and pricing setup after course creation
  handlePostCreation(courseId: number, course: CourseDto) {
    const tasks: Promise<any>[] = [];

    // Upload thumbnail if selected
    if (this.selectedThumbnailFile) {
      tasks.push(
        this.courseService.uploadThumbnail(courseId, this.selectedThumbnailFile).toPromise()
      );
    }

    // Set pricing based on mode
    if (this.pricingMode !== 'free') {
      const priceRequest: CoursePriceRequest = {
        price: Number(this.courseForm.value.price),
        priceActivationDate: this.pricingMode === 'scheduled' 
          ? this.courseForm.value.priceActivationDate 
          : undefined
      };

      tasks.push(
        this.coursePriceService.setCoursePrice(courseId, priceRequest).toPromise()
      );
    }

    // Execute all tasks
    if (tasks.length > 0) {
      Promise.all(tasks)
        .then(() => {
          this.isLoading = false;
          alert('Course created successfully with all settings!');
          this.router.navigate(['/dashboard/courses', courseId]);
        })
        .catch((error) => {
          console.error('Error in post-creation tasks:', error);
          this.isLoading = false;
          alert(`Course created but some settings failed: ${error.message}. You can update them later.`);
          this.router.navigate(['/dashboard/courses', courseId]);
        });
    } else {
      // No additional tasks, just navigate
      this.isLoading = false;
      alert('Course created successfully!');
      this.router.navigate(['/dashboard/courses', courseId]);
    }
  }

  cancel() {
    this.router.navigate(['/dashboard/courses']);
  }
}