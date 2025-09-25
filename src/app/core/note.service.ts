// note.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';

export interface CategoryDto {
  id: number;
  name?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotesDto {
  id?: number;
  title: string;
  content: string;
  category: CategoryDto;
  filePath?: string;
  fileType?: string;
  fileName?: string;
  fileSize?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface GenericResponseV2<T> {
  status: 'SUCCESS' | 'ERROR';
  message: string;
  _embedded?: T;
}

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private apiUrl = 'http://localhost:8080/api/v1/notes';
  private currentNoteSubject = new BehaviorSubject<NotesDto | null>(null);

  constructor(private http: HttpClient) {}

  // ------------------- CREATE -------------------

  createNote(note: NotesDto, selectedFile: File | null = null): Observable<NotesDto> {
    if (!note.category || !note.category.id) {
      throw new Error('Category is required');
    }
    return this.http.post<GenericResponseV2<NotesDto>>(this.apiUrl, note).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          this.currentNoteSubject.next(res._embedded);
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to create note');
      })
    );
  }

  createNoteWithDocument(note: NotesDto, documentFile?: File): Observable<NotesDto> {
    if (!note.category || !note.category.id) {
      throw new Error('Category is required');
    }

    const formData = new FormData();
    formData.append('title', note.title);
    formData.append('content', note.content);
    formData.append('category.id', note.category.id.toString());

    if (documentFile) {
      formData.append('documentFile', documentFile);
    }

    return this.http.post<GenericResponseV2<NotesDto>>(`${this.apiUrl}/with-document`, formData).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          this.currentNoteSubject.next(res._embedded);
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to create note with document');
      })
    );
  }

  // ------------------- READ -------------------

  getAllNotes(): Observable<NotesDto[]> {
    return this.http.get<GenericResponseV2<NotesDto[]>>(`${this.apiUrl}/all`).pipe(
      map(res => {
        if (res.status === 'SUCCESS') return res._embedded || [];
        if (res.status === 'ERROR' && res.message.includes('No notes found')) return [];
        throw new Error(res.message || 'Failed to fetch notes');
      })
    );
  }

  getNoteById(id: number): Observable<NotesDto> {
    return this.http.get<GenericResponseV2<NotesDto>>(`${this.apiUrl}/${id}`).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          this.currentNoteSubject.next(res._embedded);
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to fetch note');
      })
    );
  }

  getNotesByCategory(categoryId: number): Observable<NotesDto[]> {
    return this.http.get<GenericResponseV2<NotesDto[]>>(`${this.apiUrl}/category/${categoryId}`).pipe(
      map(res => {
        if (res.status === 'SUCCESS') return res._embedded || [];
        if (res.status === 'ERROR' && res.message.includes('No notes found')) return [];
        throw new Error(res.message || 'Failed to fetch notes by category');
      })
    );
  }

  // ------------------- UPDATE -------------------

  updateNote(id: number, note: NotesDto, selectedFile: File | null = null): Observable<NotesDto> {
    if (!note.category || !note.category.id) {
      throw new Error('Category is required');
    }
    return this.http.put<GenericResponseV2<NotesDto>>(`${this.apiUrl}/${id}`, note).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          this.currentNoteSubject.next(res._embedded);
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to update note');
      })
    );
  }

  // ------------------- DELETE -------------------

  deleteNote(id: number): Observable<void> {
    return this.http.delete<GenericResponseV2<void>>(`${this.apiUrl}/${id}`).pipe(
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

  // ------------------- DOCUMENT -------------------

  getDocument(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/document`, { responseType: 'blob' });
  }

  downloadDocument(id: number): Observable<{ blob: Blob, filename: string }> {
    return this.http.get(`${this.apiUrl}/${id}/document`, {
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map(response => {
        const blob = response.body!;
        let filename = 'document';
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?(.+)"?/);
          if (match) filename = match[1];
        }
        return { blob, filename };
      })
    );
  }

  // ------------------- CURRENT NOTE STATE -------------------

  getCurrentNote(): Observable<NotesDto | null> {
    return this.currentNoteSubject.asObservable();
  }

  clearCurrentNote(): void {
    this.currentNoteSubject.next(null);
  }

  // ------------------- HELPER -------------------

  createNoteWithCategoryId(title: string, content: string, categoryId: number, documentFile?: File): Observable<NotesDto> {
    const note: NotesDto = { title, content, category: { id: categoryId } };
    return documentFile ? this.createNoteWithDocument(note, documentFile) : this.createNote(note);
  }

  // ------------------- FILE HELPERS -------------------

  formatFileSize(bytes?: number): string {
    if (bytes == null) return '';
    if (bytes === 0) return '0 B';

    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(fileName: string): string {
    if (!fileName) return 'insert_drive_file';

    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'picture_as_pdf';
      case 'doc':
      case 'docx': return 'description';
      case 'xls':
      case 'xlsx': return 'grid_on';
      case 'ppt':
      case 'pptx': return 'slideshow';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'image';
      case 'mp4':
      case 'avi':
      case 'mov': return 'movie';
      case 'mp3':
      case 'wav': return 'audiotrack';
      case 'txt': return 'notes';
      default: return 'insert_drive_file';
    }
  }
}
