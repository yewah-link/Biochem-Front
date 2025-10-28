import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, map, catchError, of } from 'rxjs';

/**
 * Data Transfer Object representing a Course.
 */
export interface CourseDto {
  id?: number;
  title?: string;
  description?: string;
}

/**
 * Data Transfer Object representing a Video.
 */
export interface VideoDto {
  id?: number;
  title?: string;
  description: string;
  fileName?: string;
  filePath?: string;
  thumbnailPath?: string;
  fileType: string;
  fileSize?: number;
  duration?: number; // Duration in seconds
  course?: CourseDto;
}

/**
 * Generic API response wrapper.
 */
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

  /**
   * Upload a new video and attach it to a course.
   */
  uploadVideo(file: File, title: string, description: string, courseId: number): Observable<VideoDto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('courseId', courseId.toString());

    return this.http.post<GenericResponse<VideoDto>>(`${this.apiUrl}/upload`, formData).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          this.currentVideoSubject.next(res._embedded);
          return res._embedded;
        }
        throw new Error(res.message || 'Video upload failed');
      })
    );
  }

  /**
   * Fetch all videos in the system.
   */
  getAllVideos(): Observable<VideoDto[]> {
    return this.http.get<GenericResponse<VideoDto[]>>(`${this.apiUrl}`).pipe(
      map(res => res._embedded || [])
    );
  }

  /**
   * Fetch a video by its unique ID.
   */
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

  /**
   * Fetch all videos associated with a specific course.
   */
  getVideosByCourse(courseId: number): Observable<VideoDto[]> {
    return this.http.get<GenericResponse<VideoDto[]>>(`${this.apiUrl}/course/${courseId}`).pipe(
      map(res => res._embedded || [])
    );
  }

  /**
   * Delete a video by its ID.
   */
  deleteVideoById(id: number): Observable<void> {
    return this.http.delete<GenericResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(res => {
        if (res.status === 'SUCCESS') return;
        throw new Error(res.message || 'Failed to delete video');
      })
    );
  }

  /**
   * Observe the currently selected or active video.
   */
  getCurrentVideo(): Observable<VideoDto | null> {
    return this.currentVideoSubject.asObservable();
  }

  /**
   * Set the currently selected or active video.
   */
  setCurrentVideo(video: VideoDto | null): void {
    this.currentVideoSubject.next(video);
  }

  /**
   * Generate a thumbnail URL for a given video.
   */
  getVideoThumbnail(video: VideoDto): string {
    if (!video.id) {
      console.warn('Video ID is undefined for thumbnail request');
      return '';
    }
    return `${this.apiUrl}/thumbnail/${video.id}`;
  }

  /**
   * Generate a streaming URL for a given video.
   */
  getVideoStreamUrl(video: VideoDto): string {
    if (!video.id) {
      console.warn('Video ID is undefined for stream request');
      return '';
    }
    return `${this.apiUrl}/stream/${video.id}`;
  }

  /**
   * Check if a thumbnail exists for a given video ID.
   */
  checkThumbnailExists(videoId: number): Observable<boolean> {
    return this.http.head(`${this.apiUrl}/thumbnail/${videoId}`, {
      observe: 'response',
      responseType: 'blob'
    }).pipe(
      map(response => response.status === 200),
      catchError(() => of(false))
    );
  }

  /**
   * Retrieve a video thumbnail as a Blob.
   */
  getVideoThumbnailBlob(videoId: number): Observable<Blob | null> {
    if (!videoId) return of(null);

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

  /**
   * Stream a video file with optional range support.
   */
  streamVideoFile(videoId: number, range?: string): Observable<Blob | null> {
    if (!videoId) return of(null);

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

  /**
   * Format a byte size into a human-readable string.
   */
  formatFileSize(bytes?: number): string {
    if (!bytes || bytes === 0) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Verify that a video object has a valid ID.
   */
  isValidVideoId(video: VideoDto): boolean {
    return !!(video && video.id && video.id > 0);
  }

  /**
   * Provide a default thumbnail placeholder if none exists.
   */
  getFallbackThumbnailUrl(): string {
    return 'assets/images/video-placeholder.png';
  }
}
