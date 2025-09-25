import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NotesDto, NoteService } from '../../../core/note.service';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-note-open',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatMenuModule
  ],
  templateUrl: './note-open.html',
  styleUrls: ['./note-open.scss']
})
export class NoteOpen implements OnInit, OnDestroy {
  note: NotesDto | null = null;
  isLoading = false;
  noteId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private noteService: NoteService,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.noteId = +params['id'];
        this.loadNote();
      } else {
        this.router.navigate(['/notes']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadNote(): void {
    if (!this.noteId) return;

    this.isLoading = true;
    this.noteService.getNoteById(this.noteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (note) => {
          this.note = note;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading note:', error);
          this.isLoading = false;
          alert('Failed to load note: ' + (error.message || 'Unknown error'));
          this.router.navigate(['/notes']);
        }
      });
  }

  onEditNote(): void {
    if (this.note?.id) {
      this.router.navigate(['/notes/edit', this.note.id]);
    }
  }

  onDeleteNote(): void {
    if (!this.note?.id) return;

    if (confirm(`Are you sure you want to delete "${this.note.title}"?`)) {
      this.noteService.deleteNote(this.note.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Note deleted successfully');
            this.router.navigate(['/notes']);
          },
          error: (error) => {
            console.error('Error deleting note:', error);
            alert('Failed to delete note: ' + (error.message || 'Unknown error'));
          }
        });
    }
  }

  onDownloadDocument(): void {
    if (!this.note?.id || !this.note.fileName) return;

    this.noteService.downloadDocument(this.note.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ blob, filename }) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error downloading document:', error);
          alert('Failed to download document: ' + (error.message || 'Unknown error'));
        }
      });
  }

  onBackToList(): void {
    this.router.navigate(['/notes']);
  }

  onPreviewAttachment(): void {
    if (this.note?.fileName && this.isImageFile(this.note.fileName)) {
      this.router.navigate(['/notes', this.note.id, 'preview']);
    }
  }

  getFileIcon(filename: string): string {
    if (!filename) return 'attach_file';
    const extension = filename.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf': return 'picture_as_pdf';
      case 'doc':
      case 'docx': return 'description';
      case 'xls':
      case 'xlsx': return 'table_chart';
      case 'ppt':
      case 'pptx': return 'slideshow';
      case 'txt': return 'text_snippet';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'image';
      default: return 'attach_file';
    }
  }

  isImageFile(filename: string): boolean {
    if (!filename) return false;
    const ext = filename.toLowerCase();
    return ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.gif');
  }

  formatFileSize(bytes: number | undefined): string {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'Unknown';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getFormattedContent(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.note?.content || '');
  }
}
