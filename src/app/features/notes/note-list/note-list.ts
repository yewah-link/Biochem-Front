// note-list.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryService, CategoryDto } from '../../../core/category.service';
import { NoteService, NotesDto } from '../../../core/note.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatCardModule } from "@angular/material/card";
import { MatChipsModule } from "@angular/material/chips";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-note-list',
  standalone: true,
  templateUrl: './note-list.html',
  styleUrls: ['./note-list.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatSelectModule
  ]
})
export class NoteList implements OnInit {
  notes: NotesDto[] = [];
  categories: CategoryDto[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private noteService: NoteService,
    private categoryService: CategoryService,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotes();
    this.loadCategories();
  }

  // ------------------- LOADERS -------------------

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

  loadNotes(): void {
    this.isLoading = true;
    this.noteService.getAllNotes().subscribe({
      next: (notes) => {
        this.notes = notes;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load notes: ' + error.message;
        this.isLoading = false;
      }
    });
  }

  // ------------------- NAVIGATION -------------------

  createNote(): void {
    this.router.navigate(['/dashboard/notes/add']);
  }

  editNote(note: NotesDto): void {
    this.router.navigate(['/dashboard/notes/edit', note.id]);
  }

  // ------------------- DELETE -------------------

  deleteNote(noteId: number): void {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    this.isLoading = true;
    this.noteService.deleteNote(noteId).subscribe({
      next: () => {
        this.successMessage = 'Note deleted successfully!';
        this.loadNotes();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Delete failed: ' + error.message;
        this.isLoading = false;
      }
    });
  }

  // ------------------- HELPERS -------------------

  getCategoryName(category?: any): string {
    if (!category) return 'Uncategorized';

    if (typeof category === 'number') {
      const cat = this.categories.find(c => c.id === category);
      return cat?.name || 'Unknown';
    }

    if (typeof category === 'object' && category.id) {
      const cat = this.categories.find(c => c.id === category.id);
      return cat?.name || 'Unknown';
    }

    return 'Unknown';
  }

  truncateText(text: string, length: number = 100): string {
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  formatDate(date?: string | Date): string {
    if (!date) return '';
    return new Date(date).toLocaleString();
  }

  formatFileSize(bytes?: number): string {
    return this.noteService.formatFileSize(bytes);
  }

  getFileIcon(fileName: string): string {
    return this.noteService.getFileIcon(fileName);
  }

  downloadDocument(noteId: number): void {
    this.noteService.downloadDocument(noteId).subscribe({
      next: ({ blob, filename }) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.errorMessage = 'Download failed: ' + err.message;
      }
    });
  }

  getFormattedContent(content?: string): SafeHtml {
    if (!content) return '';
    const formatted = content.replace(/\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
