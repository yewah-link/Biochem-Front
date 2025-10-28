import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoDto, VideoService } from '../../../core/video.service';

@Component({
  selector: 'app-video-edit',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './video-edit.html',
  styleUrl: './video-edit.scss'
})
export class VideoEdit implements OnInit {
  videos: VideoDto[] = [];
  currentVideo: VideoDto | null = null;
  selectedFile: File | null = null;

  // Course-specific properties
  courseId: number | null = null;
  courseName: string = '';
  returnToCourse = false;

  // Form data
  uploadForm = {
    title: '',
    description: '',
    courseId: 1
  };

  // View states
  currentView: 'list' | 'upload' = 'list';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  uploadProgress = 0;

  constructor(
    private videoService: VideoService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['courseId']) {
        this.courseId = parseInt(params['courseId'], 10);
        this.uploadForm.courseId = this.courseId;
        this.returnToCourse = true;

        if (params['courseName']) {
          this.courseName = params['courseName'];
        }
      }

      this.currentView = params['mode'] === 'upload' ? 'upload' : 'list';
    });

    this.loadVideos();
  }

  loadVideos(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.videoService.getAllVideos().subscribe({
      next: (videos) => {
        this.videos = videos;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load videos: ' + error.message;
        this.isLoading = false;
      }
    });
  }

  switchToView(view: 'list' | 'upload'): void {
    this.currentView = view;
    this.errorMessage = '';
    this.successMessage = '';
    if (view === 'list') {
      this.resetUploadForm();
    }
  }

  playVideo(video: VideoDto): void {
    this.currentVideo = video;
    this.videoService.setCurrentVideo(video);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadVideo(): void {
    if (!this.selectedFile || !this.uploadForm.title.trim() || !this.uploadForm.description.trim()) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    if (!this.uploadForm.courseId) {
      this.errorMessage = 'Course ID is required';
      return;
    }

    this.isLoading = true;
    this.uploadProgress = 0;
    this.errorMessage = '';
    this.successMessage = '';

    this.videoService.uploadVideo(
      this.selectedFile,
      this.uploadForm.title,
      this.uploadForm.description,
      this.uploadForm.courseId
    ).subscribe({
      next: (video) => {
        if (video) {
          this.uploadProgress = 100;
          this.successMessage = 'Video uploaded successfully!';
          this.isLoading = false;

          setTimeout(() => {
            if (this.returnToCourse && this.courseId) {
              this.router.navigate(['/dashboard/courses', this.courseId]);
            } else {
              this.loadVideos();
              this.switchToView('list');
            }
            this.uploadProgress = 0;
          }, 1500);
        }
      },
      error: (error) => {
        this.errorMessage = 'Upload failed: ' + error.message;
        this.isLoading = false;
        this.uploadProgress = 0;
      }
    });
  }

  deleteVideo(id: number): void {
    if (!confirm('Are you sure you want to delete this video?')) return;

    this.isLoading = true;
    this.videoService.deleteVideoById(id).subscribe({
      next: () => {
        this.successMessage = 'Video deleted successfully!';
        this.loadVideos();
        this.isLoading = false;

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.errorMessage = 'Delete failed: ' + error.message;
        this.isLoading = false;
      }
    });
  }

  cancelAndReturn(): void {
    if (this.returnToCourse && this.courseId) {
      this.router.navigate(['/dashboard/courses', this.courseId]);
    } else {
      this.switchToView('list');
    }
  }

  formatFileSize(bytes?: number): string {
    return this.videoService.formatFileSize(bytes);
  }

  getVideoThumbnail(video: VideoDto): string {
    return this.videoService.getVideoThumbnail(video);
  }

  getVideoStreamUrl(video: VideoDto): string {
    return this.videoService.getVideoStreamUrl(video);
  }

  private resetUploadForm(): void {
    this.uploadForm = {
      title: '',
      description: '',
      courseId: this.courseId || 1
    };
    this.selectedFile = null;
    this.uploadProgress = 0;

    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
}
