import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CategoryDto, CategoryService } from '../../../core/category.service';
import { VideoDto, VideoService } from '../../../core/video.service';
import { NoteService, NotesDto } from '../../../core/note.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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
export class StudentDashboard implements OnInit {
  mobileSearchActive = false;
  mobileMenuOpen = false;
  userMenuOpen = false;
  isLoggedIn = true;
  userName = 'Alex';

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
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadNotes();
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
    
    // FIX 1: Renamed method to getVideosByCourse
    // FIX 2 & 3: Added explicit typing for data (VideoDto[]) and err (any)
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
    // Scroll to top when video is selected
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
    this.isLoggedIn = false;
    this.userMenuOpen = false;
    // Add your logout logic here (e.g., clear tokens, navigate to login)
    // this.router.navigate(['/login']);
  }
}
