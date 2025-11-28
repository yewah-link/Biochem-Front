import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

// Services
import { CourseService, CourseDto, CategoryDto as CourseCategoryDto } from '../../../../core/course.service';
import { CategoryService, CategoryDto, GenericResponseV2 } from '../../../../core/category.service';
import { VideoService, VideoDto } from '../../../../core/video.service';
import { NoteService, NotesDto } from '../../../../core/note.service';
import { CoursePriceService, CoursePriceDto, CoursePriceRequest, CourseDiscountRequest, PriceStatus } from '../../../../core/course-price.service';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './course-detail.html',
  styleUrl: './course-detail.scss'
})
export class CourseDetail implements OnInit {
  courseId: number | null = null;
  isEditMode = false;
  course: CourseDto | null = null;
  coursePrice: CoursePriceDto | null = null;
  categories: CategoryDto[] = [];
  activeTab: 'videos' | 'notes' | 'exams' = 'videos';
  isLoading = false;

  // Drag and drop state
  draggedVideoIndex: number | null = null;
  dragOverIndex: number | null = null;

  // Thumbnail handling
  selectedThumbnailFile: File | null = null;
  thumbnailPreview: string | null = null;
  isThumbnailChanged = false;

  // Pricing mode
  pricingMode: 'free' | 'immediate' | 'scheduled' = 'free';
  
  // Discount state
  hasExistingDiscount = false;

  // Form for course metadata
  courseForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private categoryService: CategoryService,
    private noteService: NoteService,
    private coursePriceService: CoursePriceService,
    private router: Router,
    private fb: FormBuilder,
    private videoService: VideoService
  ) {
    this.courseForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      categoryId: [null, Validators.required],
      estimatedHours: [0, [Validators.min(0)]],
      
      // Pricing fields
      price: [0, [Validators.min(0)]],
      priceActivationDate: [''],
      
      // Discount fields
      discountPrice: [0, [Validators.min(0)]],
      discountStartTime: [''],
      discountEndTime: ['']
    });
  }

  ngOnInit() {
    this.loadCategories();

    this.route.params.subscribe(params => {
      const id = params['id'];
      const parsedId = parseInt(id, 10);

      if (isNaN(parsedId)) {
        console.error('Invalid course ID:', id);
        alert('Invalid course ID. Redirecting to courses list.');
        this.router.navigate(['/dashboard/courses']);
        return;
      }

      this.courseId = parsedId;
      console.log('Loading course with ID:', this.courseId);
      this.loadCourse();
      this.loadCoursePricing();
    });
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

  loadCourse() {
    if (this.courseId === null || isNaN(this.courseId)) {
      console.error('Invalid course ID');
      return;
    }

    this.isLoading = true;
    this.courseService.getCourseById(this.courseId).subscribe({
      next: (course: CourseDto) => {
        this.course = course;
        console.log('Course loaded:', course);

        this.courseForm.patchValue({
          title: this.course.title || '',
          description: this.course.description || '',
          categoryId: this.course.category?.id || null,
          estimatedHours: this.course.estimatedHours || 0
        });

        // Reset thumbnail state
        this.thumbnailPreview = this.course.thumbnailUrl || null;
        this.selectedThumbnailFile = null;
        this.isThumbnailChanged = false;

        this.loadCourseNotes();

        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading course:', error);
        this.isLoading = false;

        if (error.status === 0) {
          alert('Cannot connect to server. Please check if the backend is running and CORS is configured.');
        } else if (error.status === 404) {
          alert('Course not found.');
          this.router.navigate(['/dashboard/courses']);
        } else {
          alert(`Error loading course: ${error.message}`);
        }
      }
    });
  }

  loadCoursePricing() {
    if (!this.courseId) return;

    this.coursePriceService.getCoursePricing(this.courseId).subscribe({
      next: (pricing: CoursePriceDto) => {
        this.coursePrice = pricing;
        console.log('Course pricing loaded:', pricing);

        // Determine pricing mode
        if (pricing.isFree) {
          this.pricingMode = 'free';
        } else if (pricing.priceActivationDate) {
          this.pricingMode = 'scheduled';
        } else {
          this.pricingMode = 'immediate';
        }

        // Check if discount exists
        this.hasExistingDiscount = this.coursePriceService.hasDiscount(pricing);

        // Populate pricing form fields
        this.courseForm.patchValue({
          price: pricing.price || 0,
          priceActivationDate: pricing.priceActivationDate ? this.formatDateForInput(pricing.priceActivationDate) : '',
          discountPrice: pricing.discountPrice || 0,
          discountStartTime: pricing.discountStartTime ? this.formatDateForInput(pricing.discountStartTime) : '',
          discountEndTime: pricing.discountEndTime ? this.formatDateForInput(pricing.discountEndTime) : ''
        });

        this.setupPricingValidation();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading course pricing:', error);
        // If pricing doesn't exist yet, that's okay - course might be free by default
        this.coursePrice = null;
      }
    });
  }

  loadCourseNotes() {
    if (!this.courseId) return;

    this.noteService.getNotesByCourse(this.courseId).subscribe({
      next: (notes: NotesDto[]) => {
        if (this.course) {
          this.course.notes = notes;
          console.log('Course notes loaded:', notes);
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading course notes:', error);
      }
    });
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode && this.course) {
      // Reset form and thumbnail state when canceling edit
      this.courseForm.patchValue({
        title: this.course.title,
        description: this.course.description,
        categoryId: this.course.category?.id,
        estimatedHours: this.course.estimatedHours
      });
      this.thumbnailPreview = this.course.thumbnailUrl || null;
      this.selectedThumbnailFile = null;
      this.isThumbnailChanged = false;
      
      // Reload pricing data
      if (this.coursePrice) {
        this.courseForm.patchValue({
          price: this.coursePrice.price || 0,
          priceActivationDate: this.coursePrice.priceActivationDate ? this.formatDateForInput(this.coursePrice.priceActivationDate) : '',
          discountPrice: this.coursePrice.discountPrice || 0,
          discountStartTime: this.coursePrice.discountStartTime ? this.formatDateForInput(this.coursePrice.discountStartTime) : '',
          discountEndTime: this.coursePrice.discountEndTime ? this.formatDateForInput(this.coursePrice.discountEndTime) : ''
        });
      }
    }
  }

  setPricingMode(mode: 'free' | 'immediate' | 'scheduled') {
    this.pricingMode = mode;
    this.setupPricingValidation();
  }

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

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        input.value = '';
        return;
      }

      this.selectedThumbnailFile = file;
      this.isThumbnailChanged = true;

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
    this.isThumbnailChanged = true;
    
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

    if (this.courseId === null) return;

    this.courseService.updateCourse(this.courseId, courseDto).subscribe({
      next: () => {
        console.log('Course updated successfully');
        this.handlePostUpdate();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error updating course:', error);
        this.isLoading = false;

        if (error.status === 0) {
          alert('Cannot connect to server. Please check if the backend is running.');
        } else {
          alert(`Error updating course: ${error.message}`);
        }
      }
    });
  }

  handlePostUpdate() {
    if (!this.courseId) return;

    const tasks: Promise<any>[] = [];

    // Handle thumbnail changes
    if (this.isThumbnailChanged) {
      if (!this.selectedThumbnailFile && !this.thumbnailPreview) {
        tasks.push(this.courseService.deleteThumbnail(this.courseId).toPromise());
      } else if (this.selectedThumbnailFile) {
        tasks.push(this.courseService.uploadThumbnail(this.courseId, this.selectedThumbnailFile).toPromise());
      }
    }

    // Handle pricing changes
    tasks.push(this.updatePricing());

    // Handle discount changes
    tasks.push(this.updateDiscount());

    Promise.all(tasks)
      .then(() => {
        this.finishUpdate();
      })
      .catch((error) => {
        console.error('Error in post-update tasks:', error);
        alert(`Course updated but some settings failed: ${error.message}`);
        this.finishUpdate();
      });
  }

  async updatePricing(): Promise<void> {
    if (!this.courseId) return;

    const formData = this.courseForm.value;

    if (this.pricingMode === 'free') {
      // Make course free
      await this.coursePriceService.makeCourseFree(this.courseId).toPromise();
    } else {
      // Set price (immediate or scheduled)
      const priceRequest: CoursePriceRequest = {
        price: Number(formData.price),
        priceActivationDate: this.pricingMode === 'scheduled' ? formData.priceActivationDate : undefined
      };
      await this.coursePriceService.setCoursePrice(this.courseId, priceRequest).toPromise();
    }
  }

  async updateDiscount(): Promise<void> {
    if (!this.courseId || this.pricingMode === 'free') return;

    const formData = this.courseForm.value;
    const hasDiscountData = formData.discountPrice && formData.discountStartTime && formData.discountEndTime;

    if (!hasDiscountData && this.hasExistingDiscount) {
      // Remove existing discount
      await this.coursePriceService.removeCourseDiscount(this.courseId).toPromise();
    } else if (hasDiscountData) {
      const discountRequest: CourseDiscountRequest = {
        discountPrice: Number(formData.discountPrice),
        discountStartTime: formData.discountStartTime,
        discountEndTime: formData.discountEndTime
      };

      if (this.hasExistingDiscount) {
        await this.coursePriceService.updateCourseDiscount(this.courseId, discountRequest).toPromise();
      } else {
        await this.coursePriceService.createCourseDiscount(this.courseId, discountRequest).toPromise();
      }
    }
  }

  finishUpdate() {
    this.isLoading = false;
    this.isEditMode = false;
    alert('Course updated successfully!');
    this.loadCourse();
    this.loadCoursePricing();
  }

  // Helper method to format date for datetime-local input
  formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Existing methods remain the same...
  publishCourse() {
    if (this.courseId === null) return;

    this.isLoading = true;
    this.courseService.publishCourse(this.courseId).subscribe({
      next: () => {
        console.log('Course published successfully');
        this.isLoading = false;
        alert('Course published successfully!');
        this.loadCourse();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error publishing course:', error);
        this.isLoading = false;
        alert(`Error publishing course: ${error.message}`);
      }
    });
  }

  unpublishCourse() {
    if (this.courseId === null) return;

    this.isLoading = true;
    this.courseService.unpublishCourse(this.courseId).subscribe({
      next: () => {
        console.log('Course unpublished successfully');
        this.isLoading = false;
        alert('Course unpublished successfully!');
        this.loadCourse();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error unpublishing course:', error);
        this.isLoading = false;
        alert(`Error unpublishing course: ${error.message}`);
      }
    });
  }

  deleteCourse() {
    if (this.courseId === null) return;

    const confirmed = confirm('Are you sure you want to delete this course? This action cannot be undone.');
    if (!confirmed) return;

    this.isLoading = true;
    this.courseService.deleteCourse(this.courseId).subscribe({
      next: () => {
        console.log('Course deleted successfully');
        this.isLoading = false;
        alert('Course deleted successfully!');
        this.router.navigate(['/dashboard/courses']);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error deleting course:', error);
        this.isLoading = false;
        alert(`Error deleting course: ${error.message}`);
      }
    });
  }

  getVideoThumbnailUrl(video: any): string {
    return this.videoService.getVideoThumbnail(video as VideoDto);
  }

  addVideo() {
    if (!this.courseId) {
      alert('Course ID is missing');
      return;
    }

    this.router.navigate(['/dashboard/videos'], {
      queryParams: {
        courseId: this.courseId,
        courseName: this.course?.title || 'Unknown Course'
      }
    });
  }

  editVideo(videoId: number) {
    if (!this.courseId) {
      alert('Course ID is missing');
      return;
    }

    this.router.navigate(['/dashboard/videos', videoId], {
      queryParams: {
        courseId: this.courseId,
        courseName: this.course?.title || 'Unknown Course'
      }
    });
  }

  removeVideo(videoId: number) {
    if (this.courseId === null) return;

    const confirmed = confirm('Are you sure you want to remove this video from the course?');
    if (!confirmed) return;

    this.isLoading = true;
    this.courseService.removeVideoFromCourse(this.courseId, videoId).subscribe({
      next: () => {
        console.log('Video removed successfully');
        this.isLoading = false;
        alert('Video removed successfully!');
        this.loadCourse();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error removing video:', error);
        this.isLoading = false;
        alert(`Error removing video: ${error.message}`);
      }
    });
  }

  formatDuration(seconds: number): string {
    if (!seconds || seconds === 0) return 'N/A';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts: string[] = [];

    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    if (minutes > 0) {
      parts.push(`${minutes}m`);
    }
    if (secs > 0 || parts.length === 0) {
      parts.push(`${secs}s`);
    }

    return parts.join(' ');
  }

  onVideoDragStart(event: DragEvent, index: number): void {
    this.draggedVideoIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', String(index));
    }
  }

  onVideoDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragOverIndex = index;
  }

  onVideoDrop(event: DragEvent, dropIndex: number): void {
    event.preventDefault();

    if (this.draggedVideoIndex === null || !this.course?.videos) {
      return;
    }

    const dragIndex = this.draggedVideoIndex;

    if (dragIndex === dropIndex) {
      this.draggedVideoIndex = null;
      this.dragOverIndex = null;
      return;
    }

    const videos = [...this.course.videos];
    const [draggedVideo] = videos.splice(dragIndex, 1);
    videos.splice(dropIndex, 0, draggedVideo);

    this.course.videos = videos;

    const videoIds = videos.map(v => v.id).filter((id): id is number => id !== undefined);

    console.log('New video order:', videoIds);

    if (this.courseId) {
      this.isLoading = true;
      this.videoService.reorderVideos(this.courseId, videoIds).subscribe({
        next: (reorderedVideos) => {
          console.log('Videos reordered successfully:', reorderedVideos);
          this.isLoading = false;

          if (this.course) {
            this.course.videos = reorderedVideos;
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error reordering videos:', error);
          this.isLoading = false;
          alert(`Failed to save video order: ${error.message}`);
          this.loadCourse();
        }
      });
    }

    this.draggedVideoIndex = null;
    this.dragOverIndex = null;
  }

  onVideoDragEnd(): void {
    this.draggedVideoIndex = null;
    this.dragOverIndex = null;
  }

  addNotes() {
    if (!this.courseId) {
      alert('Course ID is missing');
      return;
    }

    this.router.navigate(['/dashboard/notes'], {
      queryParams: {
        courseId: this.courseId,
        courseName: this.course?.title || 'Unknown Course'
      }
    });
  }

  editNote(noteId: number) {
    if (!this.courseId) {
      alert('Course ID is missing');
      return;
    }

    this.router.navigate(['/dashboard/notes', noteId], {
      queryParams: {
        courseId: this.courseId,
        courseName: this.course?.title || 'Unknown Course'
      }
    });
  }

  removeNote(noteId: number) {
    if (this.courseId === null) return;

    const confirmed = confirm('Are you sure you want to remove this note from the course?');
    if (!confirmed) return;

    this.isLoading = true;
    this.courseService.removeNotesFromCourse(this.courseId, noteId).subscribe({
      next: () => {
        console.log('Note removed successfully');
        this.isLoading = false;
        alert('Note removed successfully!');
        this.loadCourseNotes();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error removing note:', error);
        this.isLoading = false;
        alert(`Error removing note: ${error.message}`);
      }
    });
  }

  addExam() {
    if (!this.courseId) {
      alert('Course ID is missing');
      return;
    }

    this.router.navigate(['/dashboard/exams/add'], {
      queryParams: {
        courseId: this.courseId,
        courseName: this.course?.title || 'Unknown Course'
      }
    });
  }

  editExam(examId: number) {
    if (!this.courseId) {
      alert('Course ID is missing');
      return;
    }

    this.router.navigate(['/dashboard/exams'], {
      queryParams: {
        courseId: this.courseId,
        courseName: this.course?.title || 'Unknown Course'
      }
    });
  }

  removeExam(examId: number) {
    if (this.courseId === null) return;

    const confirmed = confirm('Are you sure you want to remove this exam from the course?');
    if (!confirmed) return;

    this.isLoading = true;
    this.courseService.removeExamFromCourse(this.courseId, examId).subscribe({
      next: () => {
        console.log('Exam removed successfully');
        this.isLoading = false;
        alert('Exam removed successfully!');
        this.loadCourse();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error removing exam:', error);
        this.isLoading = false;
        alert(`Error removing exam: ${error.message}`);
      }
    });
  }

  getCourseThumbnailUrl(): string {
    if (this.course) {
      return this.courseService.getCourseThumbnailUrl(this.course);
    }
    return 'assets/images/course-placeholder.png';
  }

  // Pricing helper methods
  getPriceDisplay(): string {
    if (!this.coursePrice) return 'Loading...';
    return this.coursePriceService.formatPrice(this.coursePrice);
  }

  getDiscountBadge(): string | null {
    if (!this.coursePrice) return null;
    return this.coursePriceService.getDiscountBadgeText(this.coursePrice);
  }

  getStatusBadge(): { text: string; colorClass: string } {
    return this.coursePriceService.getStatusBadge(this.coursePrice?.priceStatus);
  }
}