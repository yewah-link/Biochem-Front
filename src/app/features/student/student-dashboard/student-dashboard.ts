import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CourseDto, CourseService } from '../../../core/course.service';
import { VideoDto, VideoService } from '../../../core/video.service';
import { NoteService, NotesDto } from '../../../core/note.service';
import { AuthService, UserDto } from '../../../core/auth/auth.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.scss'
})
export class StudentDashboard implements OnInit, OnDestroy {
  mobileSearchActive = false;
  mobileMenuOpen = false;
  userMenuOpen = false;
  isLoggedIn = false;
  userName = 'User';
  userInitials = 'U';
  currentUser: UserDto | null = null;
  private userSubscription?: Subscription;

  @ViewChild('categoryTrack') categoryTrack!: ElementRef;

  // ✅ Keep both old and new names for template compatibility
  categories: CourseDto[] = [];
  courses: CourseDto[] = [];
  videos: VideoDto[] = [];
  notes: NotesDto[] = [];
  selectedCategoryId: number | null = null;
  selectedCourseId: number | null = null;
  selectedVideo: VideoDto | null = null;

  constructor(
    public courseService: CourseService,
    public videoService: VideoService,
    private noteService: NoteService,
    private authService: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadCourses();
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  loadUserData(): void {
    this.userSubscription = this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          this.currentUser = user;
          this.isLoggedIn = true;
          this.userName = this.getUserDisplayName(user);
          this.userInitials = this.getUserInitials(user);
        } else {
          this.isLoggedIn = false;
          this.userName = 'User';
          this.userInitials = 'U';
        }
      }
    });

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  getUserDisplayName(user: UserDto): string {
    if (user.fullName) return user.fullName;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.email) return user.email.split('@')[0];
    return 'User';
  }

  getUserInitials(user: UserDto): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  }

  loadCourses(): void {
    this.courseService.getAllCourses().subscribe({
      next: (response: any) => {
        if (response.status === 'SUCCESS') {
          this.courses = response._embedded || [];
          this.categories = this.courses; // ✅ Keep both for template compatibility
          if (this.courses.length > 0) {
            this.selectCourse(this.courses[0]);
          }
        }
      },
      error: (err: any) => console.error('Failed to load courses:', err)
    });
  }

  // ✅ Keep both methods for template compatibility
  selectCategory(category: CourseDto): void {
    this.selectCourse(category);
  }

  selectCourse(course: CourseDto): void {
    if (!course.id) return;

    this.selectedCourseId = course.id;
    this.selectedCategoryId = course.id; // ✅ Keep both for template compatibility

    this.videoService.getVideosByCourse(course.id).subscribe({
      next: (data: VideoDto[]) => {
        this.videos = data;
        this.selectedVideo = null;
      },
      error: (err: any) => console.error('Failed to load videos by course:', err)
    });

    this.noteService.getNotesByCourse(course.id).subscribe({
      next: (data: NotesDto[]) => {
        this.notes = data;
      },
      error: (err: any) => console.error('Failed to load notes by course:', err)
    });
  }

  selectVideo(video: VideoDto): void {
    this.selectedVideo = video;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getVideoStreamUrl(video: VideoDto): string {
    return this.videoService.getVideoStreamUrl(video);
  }

  getVideoThumbnail(video: VideoDto): string {
    return this.videoService.getVideoThumbnail(video);
  }

  // ✅ Keep both methods for template compatibility
  scrollCategories(direction: 'left' | 'right'): void {
    this.scrollCourses(direction);
  }

  scrollCourses(direction: 'left' | 'right'): void {
    const element = this.categoryTrack.nativeElement;
    const scrollAmount = 150;
    element.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  }

  getRecommendedVideos(): VideoDto[] {
    return this.videos.filter(video => video.id !== this.selectedVideo?.id);
  }

  // ✅ Keep for template compatibility
  getFilteredNotes(): NotesDto[] {
    return this.notes;
  }

  // ✅ Keep both methods for template compatibility
  getCategoryName(category?: any): string {
    return this.getCourseName(category);
  }

  getCourseName(courseIdOrObj?: number | any): string {
    if (!courseIdOrObj) return 'Uncategorized';

    let courseId: number | undefined;

    if (typeof courseIdOrObj === 'number') {
      courseId = courseIdOrObj;
    } else if (typeof courseIdOrObj === 'object' && courseIdOrObj.id) {
      courseId = courseIdOrObj.id;
    }

    if (!courseId) return 'Unknown';

    const course = this.courses.find(c => c.id === courseId);
    return course?.title || 'Unknown';
  }

  truncateText(text: string, length: number = 100): string {
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  getFormattedContent(content?: string): SafeHtml {
    if (!content) return '';
    const formatted = content.replace(/\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }

  hasDocument(note: NotesDto): boolean {
    return !!note.filePath;
  }

  downloadDocument(note: NotesDto): void {
    if (!note.id) return;

    this.noteService.downloadDocument(note.id).subscribe({
      next: ({ blob, filename }) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Failed to download document:', err)
    });
  }

  getFileIcon(fileName?: string): string {
    return this.noteService.getFileIcon(fileName || '');
  }

  formatFileSize(bytes?: number): string {
    return this.noteService.formatFileSize(bytes);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.userMenuOpen = false;
      },
      error: (err: any) => {
        console.error('Logout error:', err);
        this.router.navigate(['/login']);
      }
    });
  }

  getRewardPoints(): number {
    return this.currentUser?.rewardPoints || 0;
  }

  getCertificatesEarned(): number {
    return this.currentUser?.certificatesEarned || 0;
  }

  getStudentId(): string {
    return this.currentUser?.studentId || 'N/A';
  }
}