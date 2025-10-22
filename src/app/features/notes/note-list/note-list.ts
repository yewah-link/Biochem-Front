// note-list.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryService, CategoryDto } from '../../../core/category.service';
import { NoteService, NotesDto } from '../../../core/note.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-note-list',
  standalone: true,
  templateUrl: './note-list.html',
  styleUrls: ['./note-list.scss'],
  imports: []
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

  // ===============================================
  // LOADERS
  // ===============================================

  /**
   * Load all categories from the backend
   */
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

  /**
   * Load all notes from the backend
   */
  loadNotes(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.noteService.getAllNotes().subscribe({
      next: (notes) => {
        this.notes = notes;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load notes: ' + error.message;
        this.isLoading = false;
        console.error('Error loading notes:', error);
      }
    });
  }

  // ===============================================
  // NAVIGATION
  // ===============================================

  /**
   * Navigate to create new note page
   */
  createNote(): void {
    this.router.navigate(['/dashboard/notes/add']);
  }

  /**
   * Navigate to edit note page
   */
  editNote(note: NotesDto): void {
    if (note.id) {
      this.router.navigate(['/dashboard/notes/edit', note.id]);
    }
  }

  // ===============================================
  // CRUD OPERATIONS
  // ===============================================

  /**
   * Delete a note by ID
   */
  deleteNote(noteId: number): void {
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    
    this.noteService.deleteNote(noteId).subscribe({
      next: () => {
        this.successMessage = 'Note deleted successfully!';
        this.loadNotes();
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.clearMessages();
        }, 3000);
      },
      error: (error) => {
        this.errorMessage = 'Delete failed: ' + error.message;
        this.isLoading = false;
        console.error('Error deleting note:', error);
      }
    });
  }

  /**
   * Download document attached to a note
   */
  downloadDocument(noteId: number): void {
    this.noteService.downloadDocument(noteId).subscribe({
      next: ({ blob, filename }) => {
        // Create a temporary URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary anchor element and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.successMessage = 'Document downloaded successfully!';
        setTimeout(() => {
          this.clearMessages();
        }, 3000);
      },
      error: (err) => {
        this.errorMessage = 'Download failed: ' + err.message;
        console.error('Error downloading document:', err);
      }
    });
  }

  // ===============================================
  // HELPER METHODS
  // ===============================================

  /**
   * Get category name from category object or ID
   */
  getCategoryName(category?: any): string {
    if (!category) return 'Uncategorized';

    // If category is a number (categoryId)
    if (typeof category === 'number') {
      const cat = this.categories.find(c => c.id === category);
      return cat?.name || 'Unknown';
    }

    // If category is an object with id property
    if (typeof category === 'object' && category.id) {
      const cat = this.categories.find(c => c.id === category.id);
      return cat?.name || 'Unknown';
    }

    // If category is an object with name property
    if (typeof category === 'object' && category.name) {
      return category.name;
    }

    return 'Unknown';
  }

  /**
   * Truncate text to specified length with ellipsis
   */
  truncateText(text: string, length: number = 100): string {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  /**
   * Format date to readable string
   */
  formatDate(date?: string | Date): string {
    if (!date) return 'No date';
    
    try {
      const d = new Date(date);
      
      // Check if date is valid
      if (isNaN(d.getTime())) {
        return 'Invalid date';
      }
      
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  }

  /**
   * Format file size from bytes to human-readable format
   */
  formatFileSize(bytes?: number): string {
    if (!bytes) return '0 B';
    return this.noteService.formatFileSize(bytes);
  }

  /**
   * Get appropriate icon for file type
   */
  getFileIcon(fileName: string): string {
    if (!fileName) return 'description';
    return this.noteService.getFileIcon(fileName);
  }

  /**
   * Format content with line breaks for display
   */
  getFormattedContent(content?: string): SafeHtml {
    if (!content) return '';
    
    // Replace newlines with <br> tags for HTML display
    const formatted = content.replace(/\n/g, '<br>');
    
    // Sanitize and return safe HTML
    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }

  /**
   * Clear all messages (error and success)
   */
  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Track by function for ngFor performance optimization
   */
  trackByNoteId(index: number, note: NotesDto): number {
    return note.id ?? index;
  }
}