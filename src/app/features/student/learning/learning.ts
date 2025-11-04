import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CourseEnrollmentDto, CourseEnrollmentService } from '../../../core/course-enrollment.service';
import { VideosDto, CourseService, CourseDto } from '../../../core/course.service';
import { AuthService } from '../../../core/auth/auth.service';

interface VideoWithProgress extends VideosDto {
  watchProgress?: number;
  lastWatched?: string;
  isCompleted?: boolean;
}

@Component({
  selector: 'app-continue-learning',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './learning.html',
  styleUrl: './learning.scss'
})
export class Learning implements OnInit {
  selectedVideo: VideoWithProgress | null = null;
  currentCourse: CourseDto | null = null;
  enrolledCourses: CourseEnrollmentDto[] = [];
  currentEnrollment: CourseEnrollmentDto | null = null;

  // Course videos from the selected course
  courseVideos: VideoWithProgress[] = [];

  userId: number | null = null;
  isLoading: boolean = true;

  constructor(
    private courseService: CourseService,
    private enrollmentService: CourseEnrollmentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get the current logged-in user ID
    const currentUser = this.authService.getCurrentUserValue();
    if (currentUser?.id) {
      this.userId = currentUser.id;
      this.loadUserLearningData();
    } else {
      console.error('No user logged in');
      this.isLoading = false;
    }
  }

  private loadUserLearningData(): void {
    if (!this.userId) return;

    this.isLoading = true;

    // Load user's enrolled courses
    this.enrollmentService.getUserEnrollments(this.userId).subscribe({
      next: (enrollments) => {
        this.enrolledCourses = enrollments;

        // Load in-progress courses for recent videos
        this.enrollmentService.getInProgressCourses(this.userId!).subscribe({
          next: (inProgress) => {
            if (inProgress.length > 0) {
              // Get the most recent course
              this.currentEnrollment = inProgress[0];
              if (this.currentEnrollment.course) {
                this.currentCourse = this.currentEnrollment.course;
                this.loadCourseVideos();
              }
            }
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error loading in-progress courses:', err);
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading enrollments:', err);
        this.isLoading = false;
      }
    });
  }

  private loadCourseVideos(): void {
    if (!this.currentCourse?.id) return;

    // Fetch the full course details with videos
    this.courseService.getCourseById(this.currentCourse.id).subscribe({
      next: (course) => {
        this.currentCourse = course;

        if (!course.videos || course.videos.length === 0) {
          this.courseVideos = [];
          return;
        }

        // Sort videos by orderIndex
        this.courseVideos = [...course.videos]
          .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
          .map(video => ({
            ...video,
            watchProgress: Math.floor(Math.random() * 100), // Should come from backend
            lastWatched: this.getRandomLastWatched(),
            isCompleted: Math.random() > 0.5 // Should come from backend
          }));

        // Auto-select the first video
        if (this.courseVideos.length > 0) {
          this.selectedVideo = this.courseVideos[0];
        }
      },
      error: (err) => {
        console.error('Error loading course videos:', err);
        this.courseVideos = [];
      }
    });
  }

  selectVideo(video: VideoWithProgress): void {
    this.selectedVideo = video;
  }

  // Get current lesson number based on selected video
  getCurrentLessonNumber(): number {
    if (!this.selectedVideo) return 1;
    const index = this.courseVideos.findIndex(v => v.id === this.selectedVideo?.id);
    return index >= 0 ? index + 1 : 1;
  }

  // Check if there's a previous video
  hasPreviousVideo(): boolean {
    if (!this.selectedVideo || this.courseVideos.length === 0) return false;
    const currentIndex = this.courseVideos.findIndex(v => v.id === this.selectedVideo?.id);
    return currentIndex > 0;
  }

  // Check if there's a next video
  hasNextVideo(): boolean {
    if (!this.selectedVideo || this.courseVideos.length === 0) return false;
    const currentIndex = this.courseVideos.findIndex(v => v.id === this.selectedVideo?.id);
    return currentIndex < this.courseVideos.length - 1;
  }

  // Navigate to previous video
  navigateToPreviousVideo(): void {
    if (!this.hasPreviousVideo()) return;
    const currentIndex = this.courseVideos.findIndex(v => v.id === this.selectedVideo?.id);
    if (currentIndex > 0) {
      this.selectVideo(this.courseVideos[currentIndex - 1]);
    }
  }

  // Navigate to next video
  navigateToNextVideo(): void {
    if (!this.hasNextVideo()) return;
    const currentIndex = this.courseVideos.findIndex(v => v.id === this.selectedVideo?.id);
    if (currentIndex < this.courseVideos.length - 1) {
      this.selectVideo(this.courseVideos[currentIndex + 1]);
    }
  }

  // Get completed count for progress display
  getCompletedCount(): number {
    return this.courseVideos.filter(v => v.isCompleted).length;
  }

  // Get progress percentage
  getProgressPercentage(): number {
    if (this.courseVideos.length === 0) return 0;
    return (this.getCompletedCount() / this.courseVideos.length) * 100;
  }

  // Video event handlers
  onVideoTimeUpdate(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (this.selectedVideo && video.duration) {
      const progress = (video.currentTime / video.duration) * 100;
      this.selectedVideo.watchProgress = progress;

      // Auto-mark as completed at 90% watched
      if (progress >= 90 && !this.selectedVideo.isCompleted) {
        this.selectedVideo.isCompleted = true;
        // TODO: Save completion status to backend
      }
    }
  }

  onVideoLoaded(event: Event): void {
    const video = event.target as HTMLVideoElement;
    console.log('Video loaded, duration:', video.duration);
  }

  onVideoEnded(event: Event): void {
    if (this.selectedVideo) {
      this.selectedVideo.isCompleted = true;
      // TODO: Save completion status to backend

      // Auto-play next video if available
      if (this.hasNextVideo()) {
        setTimeout(() => {
          this.navigateToNextVideo();
        }, 2000);
      }
    }
  }

  onVideoError(event: Event): void {
    console.error('Video playback error:', event);
    const video = event.target as HTMLVideoElement;
    console.error('Error details:', video.error);
  }

  // Utility methods
  private getRandomLastWatched(): string {
    const options = ['2 hours ago', '1 day ago', '2 days ago', '3 days ago', 'Yesterday'];
    return options[Math.floor(Math.random() * options.length)];
  }

  formatDuration(durationSeconds?: number): string {
    return this.courseService.formatDuration(durationSeconds);
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (Math.round((bytes / Math.pow(1024, i)) * 100) / 100) + ' ' + sizes[i];
  }

  getVideoUrl(video: VideoWithProgress): string {
    // Use the video streaming URL from your backend
    if (video.id) {
      return `http://localhost:8080/api/videos/stream/${video.id}`;
    }
    return video.filePath || '';
  }

  getThumbnailUrl(video: VideoWithProgress): string {
    return video.thumbnailPath || 'assets/images/video-placeholder.png';
  }
}
