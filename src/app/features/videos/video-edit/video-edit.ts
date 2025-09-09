import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VideoDto, VideoService } from '../../../core/video.service';
import { CategoryDto, CategoryService } from '../../../core/category.service';

@Component({
  selector: 'app-video-edit',
  imports: [FormsModule],
  templateUrl: './video-edit.html',
  styleUrl: './video-edit.scss'
})
export class VideoEdit implements OnInit {
  ngOnInit(): void {
    this.loadVideos();
    this.loadCategories();
  }
  videos: VideoDto[] = [];
  categories: CategoryDto[] = [];
  currentVideo: VideoDto | null = null;
  selectedFile: File | null = null;
  
  // Form data
  uploadForm = {
    description: '',
    categoryId: 1,
    fileType: 'video/mp4'
  };


  // View states
  currentView: 'list' | 'upload' | 'play' = 'list';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private videoService: VideoService, private categoryService: CategoryService) {}

  // Load categories
  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (response) => {
        if (response.status === 'SUCCESS') {
          this.categories = response._embedded;
        }
      },
      error: (error) => {
        console.error('Failed to load categories:', error);
      }
    });
  }

  // Load all videos
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

  // Switch views
  switchToView(view: 'list' | 'upload' | 'play'): void {
    this.currentView = view;
    this.clearMessages();
  }

  
  // File selection
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      // Auto-detect file type
      this.uploadForm.fileType = file.type;
    }
  }

  
  // Upload video
  uploadVideo(): void {
    if (!this.selectedFile || !this.uploadForm.description.trim()) {
      this.errorMessage = 'Please select a file and provide a description';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.videoService.uploadVideo(
      this.selectedFile,
      this.uploadForm.description,
      this.uploadForm.categoryId,
      this.uploadForm.fileType
    ).subscribe({
      next: (video) => {
        this.successMessage = 'Video uploaded successfully!';
        this.resetUploadForm();
        this.loadVideos();
        this.isLoading = false;
        
        // Switch back to list view after successful upload
        setTimeout(() => {
          this.currentView = 'list';
          this.clearMessages();
        }, 2000);
      },
      error: (error) => {
        this.errorMessage = 'Upload failed: ' + error.message;
        this.isLoading = false;
      }
    });
  }

  // Play video
    playVideo(video: VideoDto): void {
      this.currentVideo = video;
      this.videoService.setCurrentVideo(video);
      this.currentView = 'play';
    }
  
    // Delete video
    deleteVideo(videoId: number): void {
      if (!confirm('Are you sure you want to delete this video?')) {
        return;
      }
  
      this.isLoading = true;
      this.videoService.deleteVideoById(videoId).subscribe({
        next: () => {
          this.successMessage = 'Video deleted successfully!';
          this.loadVideos();
          this.isLoading = false;
          
          setTimeout(() => {
            this.clearMessages();
          }, 3000);
        },
        error: (error) => {
          this.errorMessage = 'Delete failed: ' + error.message;
          this.isLoading = false;
        }
      });
    }
  
    // Get category name
    getCategoryName(category?: any): string {
      if (!category) return 'Uncategorized';
      
      // If category is a number (categoryId), use it directly
      if (typeof category === 'number') {
        const cat = this.categories.find(c => c.id === category);
        return cat?.name || 'Unknown';
      }
      
      // If category is an object, get the id property
      if (typeof category === 'object' && category.id) {
        const cat = this.categories.find(c => c.id === category.id);
        return cat?.name || 'Unknown';
      }
      
      return 'Unknown';
    }
  
    // Format file size
    formatFileSize(bytes?: number): string {
      if (!bytes) return 'Unknown size';
      
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
  
    // Get video thumbnail URL (placeholder for now)
    getVideoThumbnail(video: VideoDto): string {
      // Return placeholder thumbnail - replace with actual thumbnail logic
      return `http://localhost:8080/api/videos/thumbnail/${video.id}`;
    }
  
    // Get video stream URL
    getVideoStreamUrl(video: VideoDto): string {
      return `http://localhost:8080/api/videos/stream/${video.id}`;
    }
  
    // Reset upload form
    private resetUploadForm(): void {
      this.uploadForm = {
        description: '',
        categoryId: 1,
        fileType: 'video/mp4'
      };
      this.selectedFile = null;
      
      // Reset file input
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  
    // Clear messages
    private clearMessages(): void {
      this.errorMessage = '';
      this.successMessage = '';
    }


}