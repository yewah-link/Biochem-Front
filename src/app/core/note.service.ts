// NoteService.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';

export interface NotesDto {
  id?: number;
  title: string;
  content: string;
  filePath?: string;
  fileType?: string;
  fileName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface GenericResponse<T> {
  status: string;
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private apiUrl = 'http://localhost:8080/api/v1/notes';
  private currentNoteSubject = new BehaviorSubject<NotesDto | null>(null);

  constructor(private http: HttpClient) {}

  // Create note without document
  createNote(note: NotesDto): Observable<NotesDto> {
    return this.http.post<GenericResponse<NotesDto>>(this.apiUrl, note).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res.data) {
          this.currentNoteSubject.next(res.data);
          return res.data;
        }
        throw new Error(res.message || 'Failed to create note');
      })
    );
  }

  // Create note with document
  createNoteWithDocument(note: NotesDto, documentFile?: File): Observable<NotesDto> {
    const formData = new FormData();
    formData.append('title', note.title);
    formData.append('content', note.content);
    if (documentFile) {
      formData.append('documentFile', documentFile);
    }

    return this.http.post<GenericResponse<NotesDto>>(`${this.apiUrl}/with-document`, formData).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res.data) {
          this.currentNoteSubject.next(res.data);
          return res.data;
        }
        throw new Error(res.message || 'Failed to create note with document');
      })
    );
  }

  // Get all notes
  getAllNotes(): Observable<NotesDto[]> {
    return this.http.get<GenericResponse<NotesDto[]>>(`${this.apiUrl}/all`).pipe(
      map(res => res.data || [])
    );
  }

  // Get note by ID
  getNoteById(id: number): Observable<NotesDto> {
    return this.http.get<GenericResponse<NotesDto>>(`${this.apiUrl}/${id}`).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res.data) {
          this.currentNoteSubject.next(res.data);
          return res.data;
        }
        throw new Error(res.message || 'Failed to fetch note');
      })
    );
  }

  // Delete note
  deleteNote(id: number): Observable<void> {
    return this.http.delete<GenericResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(res => {
        if (res.status === 'SUCCESS') {
          if (this.currentNoteSubject.value?.id === id) {
            this.currentNoteSubject.next(null);
          }
          return;
        }
        throw new Error(res.message || 'Failed to delete note');
      })
    );
  }

  // Download document
  getDocument(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/document`, { responseType: 'blob' });
  }

  // Current note state
  getCurrentNote(): Observable<NotesDto | null> {
    return this.currentNoteSubject.asObservable();
  }
}
