import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoDto } from '../../../core/video.service';

@Component({
  selector: 'app-video-play',
  imports: [CommonModule],
  templateUrl: './video-play.html',
  styleUrls: ['./video-play.scss'] // <-- corrected from "styleUrl"
})
export class VideoPlay implements OnInit, OnDestroy {
  @Input() video: VideoDto | null = null;
  @Output() backRequested = new EventEmitter<void>();
  @Output() videoDeleted = new EventEmitter<number>();

  @ViewChild('videoPlayer', { static: false }) videoPlayer!: ElementRef<HTMLVideoElement>;

  // Player state
  isPlaying: boolean = false;
  currentTime: number = 0;
  duration: number = 0;
  volume: number = 1;
  isMuted: boolean = false;
  isFullscreen: boolean = false;
  showControls: boolean = true;

  // UI state
  controlsTimeout: any;

  constructor() {}

  ngOnInit(): void {
    this.setupControlsTimeout();
  }

  ngOnDestroy(): void {
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    }
  }

  // Video controls
  togglePlayPause(): void {
    if (!this.videoPlayer) return;

    const video = this.videoPlayer.nativeElement;
    if (video.paused) {
      video.play();
      this.isPlaying = true;
    } else {
      video.pause();
      this.isPlaying = false;
    }
  }

  toggleMute(): void {
    if (!this.videoPlayer) return;

    const video = this.videoPlayer.nativeElement;
    this.isMuted = !this.isMuted;
    video.muted = this.isMuted;
  }

  toggleFullscreen(): void {
    if (!this.videoPlayer) return;

    const video = this.videoPlayer.nativeElement;
    if (!document.fullscreenElement) {
      video.requestFullscreen();
      this.isFullscreen = true;
    } else {
      document.exitFullscreen();
      this.isFullscreen = false;
    }
  }

  seekTo(event: Event): void {
    if (!this.videoPlayer) return;

    const input = event.target as HTMLInputElement;
    const video = this.videoPlayer.nativeElement;
    video.currentTime = parseFloat(input.value);
  }

  setVolume(event: Event): void {
    if (!this.videoPlayer) return;

    const input = event.target as HTMLInputElement;
    const video = this.videoPlayer.nativeElement;
    this.volume = parseFloat(input.value);
    video.volume = this.volume;
  }

  onTimeUpdate(): void {
    if (!this.videoPlayer) return;
    const video = this.videoPlayer.nativeElement;
    this.currentTime = video.currentTime;
    this.duration = video.duration || 0;
  }

  onVideoLoadedMetadata(): void {
    if (!this.videoPlayer) return;
    const video = this.videoPlayer.nativeElement;
    this.duration = video.duration;
  }

  onVideoEnded(): void {
    this.isPlaying = false;
  }

  onVideoError(): void {
    console.error('Video failed to load');
  }

  onPlayerMouseMove(): void {
    this.showControls = true;
    this.setupControlsTimeout();
  }

  onPlayerMouseLeave(): void {
    if (this.isPlaying) {
      this.showControls = false;
    }
  }

  private setupControlsTimeout(): void {
    if (this.controlsTimeout) clearTimeout(this.controlsTimeout);

    this.controlsTimeout = setTimeout(() => {
      if (this.isPlaying) {
        this.showControls = false;
      }
    }, 3000);
  }

  onBackClick(): void {
    this.backRequested.emit();
  }

  onDeleteClick(): void {
    if (this.video?.id) {
      this.videoDeleted.emit(this.video.id);
    }
  }

  getVideoStreamUrl(): string {
    return this.video ? `http://localhost:8080/api/videos/stream/${this.video.id}` : '';
  }

  formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (Math.round((bytes / Math.pow(1024, i)) * 100) / 100) + ' ' + sizes[i];
  }

  getCategoryName(): string {
    return this.video?.category?.name || 'Uncategorized';
  }
}
