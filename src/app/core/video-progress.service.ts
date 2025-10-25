import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface VideoProgressDto {
  id?: number;
  userId: number;
  videoId: number;
  courseId: number;
  isWatched?: boolean;
  watchedSeconds?: number;
  totalSeconds?: number;
  lastWatchedAt?: string;
}

interface GenericResponseV2<T> {
  status: string;
  message: string;
  _embedded?: T;
}

@Injectable({
  providedIn: 'root'
})
export class VideoProgressService {
  private apiUrl = 'http://localhost:8080/api/v1/video-progress';

  constructor(private http: HttpClient) {}

  // Progress tracking
  markVideoAsWatched(userId: number, videoId: number, courseId: number): Observable<VideoProgressDto> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('videoId', videoId.toString())
      .set('courseId', courseId.toString());
    return this.http.post<GenericResponseV2<VideoProgressDto>>(`${this.apiUrl}/mark-watched`, null, { params }).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to mark video as watched');
      })
    );
  }

  updateWatchProgress(userId: number, videoId: number, watchedSeconds: number): Observable<VideoProgressDto> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('videoId', videoId.toString())
      .set('watchedSeconds', watchedSeconds.toString());
    return this.http.put<GenericResponseV2<VideoProgressDto>>(`${this.apiUrl}/update-progress`, null, { params }).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to update watch progress');
      })
    );
  }

  // Read operations
  getVideoProgress(userId: number, videoId: number): Observable<VideoProgressDto> {
    return this.http.get<GenericResponseV2<VideoProgressDto>>(`${this.apiUrl}/user/${userId}/video/${videoId}`).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to fetch video progress');
      })
    );
  }

  getCourseVideoProgress(userId: number, courseId: number): Observable<VideoProgressDto[]> {
    return this.http.get<GenericResponseV2<VideoProgressDto[]>>(`${this.apiUrl}/user/${userId}/course/${courseId}`).pipe(
      map(res => res._embedded || [])
    );
  }

  getWatchedVideoCount(userId: number, courseId: number): Observable<number> {
    return this.http.get<GenericResponseV2<number>>(`${this.apiUrl}/user/${userId}/course/${courseId}/count`).pipe(
      map(res => res._embedded || 0)
    );
  }

  isVideoWatched(userId: number, videoId: number): Observable<boolean> {
    return this.http.get<GenericResponseV2<boolean>>(`${this.apiUrl}/user/${userId}/video/${videoId}/is-watched`).pipe(
      map(res => res._embedded || false)
    );
  }

  // Helper method to calculate watch percentage
  calculateWatchPercentage(watchedSeconds?: number, totalSeconds?: number): number {
    if (!watchedSeconds || !totalSeconds || totalSeconds === 0) return 0;
    return Math.round((watchedSeconds / totalSeconds) * 100);
  }

  // Format time in seconds to MM:SS
  formatTime(seconds?: number): string {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
