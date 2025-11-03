import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CourseEnrollmentDto, CourseEnrollmentService } from '../../../core/course-enrollment.service';
import { VideosDto, CourseService, CourseDto } from '../../../core/course.service';


interface VideoWithProgress extends VideosDto {
  watchProgress?: number;
  lastWatched?: string;
  isCompleted?: boolean;
}

interface WeeklyGoal {
  id: number;
  title: string;
  description: string;
  completed: boolean;
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

  // Recently watched videos across all courses
  recentVideos: VideoWithProgress[] = [];

  // Recommended courses
  recommendedCourses: CourseDto[] = [];

  weeklyGoals: WeeklyGoal[] = [
    {
      id: 1,
      title: 'Complete Current Course Module',
      description: 'Finish all videos in the current section',
      completed: false
    },
    {
      id: 2,
      title: 'Watch 5 Videos This Week',
      description: 'Stay consistent with your learning',
      completed: false
    },
    {
      id: 3,
      title: 'Take Practice Test',
      description: 'Test your knowledge on completed modules',
      completed: false
    },
    {
      id: 4,
      title: 'Review Course Notes',
      description: 'Go through all saved notes from this week',
      completed: false
    }
  ];

  userId: number = 1; // Should come from auth service
  isLoading: boolean = true;

  constructor(
    private courseService: CourseService,
    private enrollmentService: CourseEnrollmentService
  ) {}

  ngOnInit(): void {
    this.loadUserLearningData();
  }

  private loadUserLearningData(): void {
    this.isLoading = true;

    // Load user's enrolled courses
    this.enrollmentService.getUserEnrollments(this.userId).subscribe({
      next: (enrollments) => {
        this.enrolledCourses = enrollments;

        // Load in-progress courses for recent videos
        this.enrollmentService.getInProgressCourses(this.userId).subscribe({
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

        // Load recommended courses
        this.loadRecommendedCourses();
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
          this.recentVideos = [];
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
        
        // Set recent videos (last 3 watched)
        this.recentVideos = this.courseVideos
          .filter(v => v.watchProgress && v.watchProgress > 0)
          .slice(0, 3);
      },
      error: (err) => {
        console.error('Error loading course videos:', err);
        this.courseVideos = [];
        this.recentVideos = [];
      }
    });
  }

  private loadRecommendedCourses(): void {
    this.courseService.getPublishedCourses().subscribe({
      next: (courses) => {
        // Filter out already enrolled courses
        const enrolledIds = this.enrolledCourses.map(e => e.courseId);
        this.recommendedCourses = courses
          .filter(c => c.id && !enrolledIds.includes(c.id))
          .slice(0, 4);
      },
      error: (err) => {
        console.error('Error loading recommended courses:', err);
      }
    });
  }

  selectVideo(video: VideoWithProgress): void {
    this.selectedVideo = video;
    document.body.style.overflow = 'hidden';
  }

  closeVideo(): void {
    this.selectedVideo = null;
    document.body.style.overflow = 'auto';
  }

  enrollInCourse(course: CourseDto): void {
    if (!course.id) return;

    this.enrollmentService.enrollInCourse(this.userId, course.id).subscribe({
      next: (enrollment) => {
        console.log('Enrolled in course:', enrollment);
        this.loadUserLearningData();
      },
      error: (err) => {
        console.error('Error enrolling in course:', err);
      }
    });
  }

  toggleGoal(goal: WeeklyGoal): void {
    goal.completed = !goal.completed;
    this.saveGoalProgress(goal);
  }

  private saveGoalProgress(goal: WeeklyGoal): void {
    // Save to backend or local storage
    console.log('Goal updated:', goal);
  }

  private getRandomLastWatched(): string {
    const options = ['2 hours ago', '1 day ago', '2 days ago', '3 days ago', 'Yesterday'];
    return options[Math.floor(Math.random() * options.length)];
  }

  formatDuration(durationSeconds?: number): string {
    return this.courseService.formatDuration(durationSeconds);
  }

  getVideoUrl(video: VideoWithProgress): string {
    return video.filePath || '';
  }

  getThumbnailUrl(video: VideoWithProgress): string {
    return video.thumbnailPath || 'assets/images/video-placeholder.png';
  }

  getCourseThumbnailUrl(course: CourseDto): string {
    return course.thumbnailUrl || 'assets/images/course-placeholder.png';
  }

  markVideoAsCompleted(video: VideoWithProgress): void {
    video.isCompleted = true;
    video.watchProgress = 100;
    // Update backend
    console.log('Video marked as completed:', video);
  }

  continueWatching(): void {
    // Resume video at last watched position
    console.log('Continuing video:', this.selectedVideo);
  }
}