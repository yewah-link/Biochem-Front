import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, map, catchError, of } from 'rxjs';

// Interfaces - outside the service class
export interface CategoryDto {
  id?: number;
  name?: string;
  description?: string;
}

export interface VideoDto {
  id?: number;
  description: string;
  fileName?: string;
  filePath?: string;
  thumbnailPath?: string;
  fileType: string;
  fileSize?: number;
  category?: CategoryDto;
}

interface GenericResponse<T> {
  status: string;
  message: string;
  _embedded?: T;
}

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private apiUrl = 'http://localhost:8080/api/videos';
  private currentVideoSubject = new BehaviorSubject<VideoDto | null>(null);

  constructor(private http: HttpClient) {}

  // Upload a new video
  uploadVideo(file: File, description: string, categoryId: number, fileType: string): Observable<VideoDto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    formData.append('categoryId', categoryId.toString());

    return this.http.post<GenericResponse<VideoDto>>(`${this.apiUrl}/upload`, formData).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          this.currentVideoSubject.next(res._embedded);
          return res._embedded;
        }
        throw new Error(res.message || 'Upload failed');
      })
    );
  }

  // Get all videos
  getAllVideos(): Observable<VideoDto[]> {
    return this.http.get<GenericResponse<VideoDto[]>>(`${this.apiUrl}`).pipe(
      map(res => res._embedded || [])
    );
  }

  // Get a single video by ID
  getVideoById(id: number): Observable<VideoDto> {
    return this.http.get<GenericResponse<VideoDto>>(`${this.apiUrl}/${id}`).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to fetch video');
      })
    );
  }

  // Get videos by category
  getVideosByCategory(categoryId: number): Observable<VideoDto[]> {
    return this.http.get<GenericResponse<VideoDto[]>>(`${this.apiUrl}/category/${categoryId}`).pipe(
      map(res => res._embedded || [])
    );
  }

  // Delete a video by ID
  deleteVideoById(id: number): Observable<void> {
    return this.http.delete<GenericResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(res => {
        if (res.status === 'SUCCESS') return;
        throw new Error(res.message || 'Failed to delete video');
      })
    );
  }

  // Get current video
  getCurrentVideo(): Observable<VideoDto | null> {
    return this.currentVideoSubject.asObservable();
  }

  // Set current video
  setCurrentVideo(video: VideoDto | null): void {
    this.currentVideoSubject.next(video);
  }

  // Get video thumbnail URL - Fixed to handle undefined IDs properly
  getVideoThumbnail(video: VideoDto): string {
    if (!video.id) {
      console.warn('Video ID is undefined for thumbnail request');
      return '';
    }
    return `${this.apiUrl}/thumbnail/${video.id}`;
  }

  // Get video stream URL - Fixed to handle undefined IDs properly
  getVideoStreamUrl(video: VideoDto): string {
    if (!video.id) {
      console.warn('Video ID is undefined for stream request');
      return '';
    }
    return `${this.apiUrl}/stream/${video.id}`;
  }

  // Check if thumbnail exists for a video
  checkThumbnailExists(videoId: number): Observable<boolean> {
    return this.http.head(`${this.apiUrl}/thumbnail/${videoId}`, {
      observe: 'response',
      responseType: 'blob'
    }).pipe(
      map(response => response.status === 200),
      catchError(() => of(false))
    );
  }

  // Get video thumbnail as blob for display with proper error handling
  getVideoThumbnailBlob(videoId: number): Observable<Blob | null> {
    if (!videoId) {
      return of(null);
    }

    return this.http.get(`${this.apiUrl}/thumbnail/${videoId}`, {
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': 'image/jpeg, image/png, image/gif, image/webp, */*'
      })
    }).pipe(
      catchError(error => {
        console.error(`Failed to load thumbnail for video ${videoId}:`, error);
        return of(null);
      })
    );
  }

  // Stream video file with range support
  streamVideoFile(videoId: number, range?: string): Observable<Blob | null> {
    if (!videoId) {
      return of(null);
    }

    const headers = new HttpHeaders({
      'Accept': 'video/mp4, video/webm, video/ogg, video/*',
      ...(range && { 'Range': range })
    });

    return this.http.get(`${this.apiUrl}/stream/${videoId}`, {
      responseType: 'blob',
      headers
    }).pipe(
      catchError(error => {
        console.error(`Failed to stream video ${videoId}:`, error);
        return of(null);
      })
    );
  }

  // Format file size utility method
  formatFileSize(bytes?: number): string {
    if (!bytes || bytes === 0) return 'Unknown size';

    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Validate video ID helper
  isValidVideoId(video: VideoDto): boolean {
    return !!(video && video.id && video.id > 0);
  }

  // Generate fallback thumbnail URL (could be a placeholder image)
  getFallbackThumbnailUrl(): string {
    return 'assets/images/video-placeholder.png';
  }
}
