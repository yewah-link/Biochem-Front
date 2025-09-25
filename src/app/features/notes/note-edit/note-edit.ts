// note-edit.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { NotesDto, NoteService } from '../../../core/note.service';
import { CategoryDto, CategoryService } from '../../../core/category.service';

@Component({
  selector: 'app-note-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './note-edit.html',
  styleUrl: './note-edit.scss'
})
export class NoteEdit implements OnInit {
  noteForm!: FormGroup;
  note: NotesDto | null = null;
  categories: CategoryDto[] = [];
  selectedFile: File | null = null;
  isLoading = false;
  isEditMode = false;
  noteId: number | null = null;
  preSelectedCategoryId: number | null = null;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private noteService: NoteService,
    private categoryService: CategoryService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadCategories();

    // Get route parameters
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.noteId = +params['id'];
        this.isEditMode = true;
        this.loadNote();
      }
      if (params['categoryId']) {
        this.preSelectedCategoryId = +params['categoryId'];
        this.noteForm.patchValue({ categoryId: this.preSelectedCategoryId });
      }
    });
  }

  private initForm(): void {
    this.noteForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.maxLength(5000)]],
      categoryId: ['', Validators.required]
    });
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (response) => {
        if (response.status === 'SUCCESS') {
          this.categories = response._embedded;
        }
      },
      error: (error) => {
        console.error('Failed to load categories:', error);
        this.errorMessage = 'Failed to load categories';
      }
    });
  }

  private loadNote(): void {
    if (!this.noteId) return;

    this.isLoading = true;
    this.noteService.getNoteById(this.noteId).subscribe({
      next: (note) => {
        this.note = note;
        this.noteForm.patchValue({
          title: note.title,
          content: note.content,
          categoryId: note.category?.id || ''
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading note:', error);
        this.errorMessage = 'Failed to load note';
        this.isLoading = false;
        this.router.navigate(['/notes']);
      }
    });
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.errorMessage = 'File size must be less than 10MB';
        return;
      }

      // Validate file type
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.xls', '.xlsx', '.ppt', '.pptx'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

      if (!allowedExtensions.includes(fileExtension)) {
        this.errorMessage = 'File type not supported. Please choose a valid document or image file.';
        return;
      }

      this.selectedFile = file;
      this.errorMessage = '';
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSave(): void {
    if (this.noteForm.invalid) {
      this.noteForm.markAllAsTouched();
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.noteForm.value;
    const noteData: NotesDto = {
      title: formValue.title,
      content: formValue.content,
      category: { id: formValue.categoryId }
    };

    // If editing existing note, include the ID
    if (this.isEditMode && this.noteId) {
      noteData.id = this.noteId;
    }

    let saveObservable;

    if (this.isEditMode && this.noteId) {
      // UPDATE existing note
      saveObservable = this.selectedFile
        ? this.noteService.createNoteWithDocument(noteData, this.selectedFile)
        : this.noteService.updateNote(this.noteId, noteData);
    } else {
      // CREATE new note
      saveObservable = this.selectedFile
        ? this.noteService.createNoteWithDocument(noteData, this.selectedFile)
        : this.noteService.createNote(noteData);
    }

    saveObservable.subscribe({
      next: (savedNote) => {
        const action = this.isEditMode ? 'updated' : 'created';
        this.successMessage = `Note ${action} successfully!`;
        this.isLoading = false;

        // Navigate after delay
        setTimeout(() => {
          this.router.navigate(['/notes']);
        }, 1500);
      },
      error: (error) => {
        const action = this.isEditMode ? 'update' : 'create';
        this.errorMessage = `Failed to ${action} note: ${error.message || 'Unknown error'}`;
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    if (this.isEditMode && this.noteId) {
      this.router.navigate(['/notes', this.noteId]);
    } else {
      this.router.navigate(['/notes']);
    }
  }

  // ✅ Use NoteService helpers instead of duplicates
  getFileIcon(filename: string): string {
    return this.noteService.getFileIcon(filename);
  }

  formatFileSize(bytes: number): string {
    return this.noteService.formatFileSize(bytes);
  }

  getErrorMessage(field: string): string {
    const control = this.noteForm.get(field);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.getFieldDisplayName(field)} is required`;
      }
      if (control.errors['maxlength']) {
        const maxLength = control.errors['maxlength'].requiredLength;
        return `${this.getFieldDisplayName(field)} cannot exceed ${maxLength} characters`;
      }
    }
    return '';
  }

  private getFieldDisplayName(field: string): string {
    switch (field) {
      case 'categoryId': return 'Category';
      default: return field.charAt(0).toUpperCase() + field.slice(1);
    }
  }

  hasError(field: string): boolean {
    const control = this.noteForm.get(field);
    return !!(control?.errors && control.touched);
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Edit Note' : 'Create Note';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Update Note' : 'Create Note';
  }
}
