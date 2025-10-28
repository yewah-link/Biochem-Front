import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CategoryDto, CategoryService } from '../../../core/category.service';
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

  categories: CategoryDto[] = [];
  videos: VideoDto[] = [];
  notes: NotesDto[] = [];
  selectedCategoryId: number | null = null;
  selectedVideo: VideoDto | null = null;

  constructor(
    public categoryService: CategoryService,
    public videoService: VideoService,
    private noteService: NoteService,
    private authService: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadCategories();
    this.loadNotes();
  }

  ngOnDestroy(): void {
    // Clean up subscription to prevent memory leaks
    this.userSubscription?.unsubscribe();
  }

  loadUserData(): void {
    // Subscribe to current user changes
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

    // Check if user is logged in on component init
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

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (res) => {
        this.categories = res._embedded || [];
        if (this.categories.length > 0) {
          this.selectCategory(this.categories[0]);
        }
      },
      error: (err: any) => console.error('Failed to load categories:', err)
    });
  }

  loadNotes(): void {
    this.noteService.getAllNotes().subscribe({
      next: (notes: NotesDto[]) => {
        this.notes = notes;
      },
      error: (err: any) => console.error('Failed to load notes:', err)
    });
  }

  getFilteredNotes(): NotesDto[] {
    if (!this.selectedCategoryId) {
      return this.notes;
    }
    return this.notes.filter(note => {
      if (typeof note.category === 'object' && note.category.id) {
        return note.category.id === this.selectedCategoryId;
      }
      return false;
    });
  }

  selectCategory(category: CategoryDto): void {
    if (!category.id) return;

    this.selectedCategoryId = category.id;
    
    this.videoService.getVideosByCourse(category.id).subscribe({
      next: (data: VideoDto[]) => {
        this.videos = data;
        this.selectedVideo = null;
      },
      error: (err: any) => console.error('Failed to load videos by category:', err)
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

  scrollCategories(direction: 'left' | 'right'): void {
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

  getCategoryName(category?: any): string {
    if (!category) return 'Uncategorized';

    if (typeof category === 'number') {
      const cat = this.categories.find(c => c.id === category);
      return cat?.name || 'Unknown';
    }

    if (typeof category === 'object' && category.id) {
      const cat = this.categories.find(c => c.id === category.id);
      return cat?.name || 'Unknown';
    }

    return 'Unknown';
  }

  truncateText(text: string, length: number = 100): string {
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  getFormattedContent(content?: string): SafeHtml {
    if (!content) return '';
    const formatted = content.replace(/\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.userMenuOpen = false;
        // The authService.logout() already navigates to login
      },
      error: (err: any) => {
        console.error('Logout error:', err);
        // Force logout even if server request fails
        this.router.navigate(['/login']);
      }
    });
  }

  // Helper methods to access user data in template
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