import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CategoryDto, CategoryService } from '../../../core/category.service';
import { VideoDto, VideoService } from '../../../core/video.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    MatToolbarModule,
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.scss'
})
export class StudentDashboard implements OnInit {
  mobileSearchActive = false;
  isLoggedIn = true;
  userName = 'Alex';

  @ViewChild('categoryTrack') categoryTrack!: ElementRef;

  categories: CategoryDto[] = [];
  videos: VideoDto[] = [];
  selectedCategoryId: number | null = null;
  selectedVideo: VideoDto | null = null;

  constructor(public categoryService: CategoryService, public videoService: VideoService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (res) => {
        this.categories = res._embedded || [];
        // Auto-select first category
        if (this.categories.length > 0) {
          this.selectCategory(this.categories[0]);
        }
      },
      error: (err) => console.error('Failed to load categories:', err)
    });
  }

  selectCategory(category: CategoryDto): void {
    if (!category.id) return;

    this.selectedCategoryId = category.id;
    this.videoService.getVideosByCategory(category.id).subscribe({
      next: (data) => {
        this.videos = data;
        this.selectedVideo = null; // Reset selected video when category changes
      },
      error: (err) => console.error('Failed to load videos by category:', err)
    });
  }

  selectVideo(video: VideoDto): void {
    this.selectedVideo = video;
  }

  getVideoStreamUrl(video: VideoDto): string {
    return this.videoService.getVideoStreamUrl(video);
  }

  getVideoThumbnail(video: VideoDto): string {
    return this.videoService.getVideoThumbnail(video);
  }

  scrollCategories(direction: 'left' | 'right') {
    const element = this.categoryTrack.nativeElement;
    const scrollAmount = 150;
    element.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  }

  logout() {
    this.isLoggedIn = false;
  }
}
