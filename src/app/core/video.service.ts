import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';

// Interfaces - moved outside the service class
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

  // Stream video metadata
  streamVideo(id: number): Observable<VideoDto> {
    return this.http.get<GenericResponse<VideoDto>>(`${this.apiUrl}/stream/${id}`).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to stream video');
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
}