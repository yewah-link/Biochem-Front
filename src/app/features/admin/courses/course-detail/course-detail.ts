import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

// Course Service
import { CourseService, CourseDto, CategoryDto as CourseCategoryDto } from '../../../../core/course.service';

// Category Service
import { CategoryService, CategoryDto, GenericResponseV2 } from '../../../../core/category.service';

// Video Service
import { VideoService, VideoDto } from '../../../../core/video.service';

// Note Service
import { NoteService, NotesDto } from '../../../../core/note.service';

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
  categories: CategoryDto[] = [];
  activeTab: 'videos' | 'notes' | 'exams' = 'videos';
  isLoading = false;

  // Drag and drop state
  draggedVideoIndex: number | null = null;
  dragOverIndex: number | null = null;

  // Form for course metadata
  courseForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private categoryService: CategoryService,
    private noteService: NoteService,
    private router: Router,
    private fb: FormBuilder,
    private videoService: VideoService
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
          thumbnailUrl: this.course.thumbnailUrl || '',
          estimatedHours: this.course.estimatedHours || 0
        });

        // ✅ Load notes filtered by course
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

  // ✅ NEW METHOD: Load notes filtered by course
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
        // Don't show alert for notes loading failure, just log it
      }
    });
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode && this.course) {
      this.courseForm.patchValue({
        title: this.course.title,
        description: this.course.description,
        categoryId: this.course.category?.id,
        thumbnailUrl: this.course.thumbnailUrl,
        estimatedHours: this.course.estimatedHours
      });
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
      thumbnailUrl: formData.thumbnailUrl,
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
        this.isLoading = false;
        this.isEditMode = false;
        alert('Course updated successfully!');
        this.loadCourse();
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

  // ========================================
  // VIDEO METHODS
  // ========================================

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

  /*
  NOTES METHODS 
  */

  addNotes() {
  if (!this.courseId) {
    alert('Course ID is missing');
    return;
  }

  // ✅ Navigate to '/dashboard/notes' (no /create, no /add)
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

  // ✅ Navigate to '/dashboard/notes/:id' with noteId in path
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

      // ✅ Reload notes after removal
      this.loadCourseNotes();
    },
    error: (error: HttpErrorResponse) => {
      console.error('Error removing note:', error);
      this.isLoading = false;
      alert(`Error removing note: ${error.message}`);
    }
  });
}

  // ========================================
  // EXAM METHODS
  // ========================================

  addExam() {
    this.router.navigate(['/dashboard/courses', this.courseId, 'exams', 'add']);
  }

  editExam(examId: number) {
    this.router.navigate(['/dashboard/courses', this.courseId, 'exams', examId, 'edit']);
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
}
