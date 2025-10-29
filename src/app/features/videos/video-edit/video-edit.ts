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
  selectedFile: File | null = null;

  // Edit mode properties
  isEditingVideo = false;
  editingVideo: VideoDto | null = null;
  editingVideoId: number | null = null;

  // Course-specific properties (REQUIRED)
  courseId: number | null = null;
  courseName: string = '';

  // Form data
  uploadForm = {
    title: '',
    description: '',
    courseId: 0
  };

  // View states
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
    // Check route params for video ID (for edit mode)
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.editingVideoId = parseInt(params['id'], 10);
        this.isEditingVideo = true;
      }
    });

    // Check query parameters - courseId is REQUIRED
    this.route.queryParams.subscribe(params => {
      if (!params['courseId']) {
        this.errorMessage = 'Course ID is required. Redirecting...';
        setTimeout(() => {
          this.router.navigate(['/dashboard/courses']);
        }, 2000);
        return;
      }

      this.courseId = parseInt(params['courseId'], 10);
      this.uploadForm.courseId = this.courseId;

      if (params['courseName']) {
        this.courseName = params['courseName'];
      }
    });

    // Load video for editing if in edit mode
    if (this.isEditingVideo && this.editingVideoId) {
      this.loadVideoForEdit(this.editingVideoId);
    }
  }

  loadVideoForEdit(videoId: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.videoService.getVideoById(videoId).subscribe({
      next: (video) => {
        this.editingVideo = { ...video }; // Create a copy to edit
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load video: ' + error.message;
        this.isLoading = false;
      }
    });
  }

  saveVideoChanges(): void {
    if (!this.editingVideo || !this.editingVideoId) {
      this.errorMessage = 'No video to save';
      return;
    }

    // Check if title and description exist and are not empty after trimming
    const title = this.editingVideo.title?.trim() || '';
    const description = this.editingVideo.description?.trim() || '';

    if (!title || !description) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.videoService.updateVideo(this.editingVideoId, this.editingVideo).subscribe({
      next: (updatedVideo: VideoDto) => {
        this.successMessage = 'Video updated successfully!';
        this.isLoading = false;

        setTimeout(() => {
          this.backToCourse();
        }, 1500);
      },
      error: (error: Error) => {
        this.errorMessage = 'Failed to update video: ' + error.message;
        this.isLoading = false;
      }
    });
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
            this.backToCourse();
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

  backToCourse(): void {
    if (this.courseId) {
      this.router.navigate(['/dashboard/courses', this.courseId]);
    } else {
      this.router.navigate(['/dashboard/courses']);
    }
  }

  formatFileSize(bytes?: number): string {
    return this.videoService.formatFileSize(bytes);
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

  getVideoStreamUrl(video: VideoDto): string {
    return this.videoService.getVideoStreamUrl(video);
  }
}
