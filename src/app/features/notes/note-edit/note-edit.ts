import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotesDto, NoteService } from '../../../core/note.service';

@Component({
  selector: 'app-note-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './note-edit.html',
  styleUrl: './note-edit.scss'
})
export class NoteEdit implements OnInit, OnDestroy {
  @Input() note: NotesDto | null = null;
  @Output() saveNote = new EventEmitter<NotesDto>();
  @Output() cancelEdit = new EventEmitter<void>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  noteForm: FormGroup;
  isLoading = false;
  selectedFile: File | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private noteService: NoteService,
    private snackBar: MatSnackBar
  ) {
    this.noteForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.maxLength(5000)]]
    });
  }

  ngOnInit(): void {
    if (this.note) {
      this.noteForm.patchValue({
        title: this.note.title,
        content: this.note.content
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];

      if (!allowedTypes.includes(file.type)) {
        this.snackBar.open('Invalid file type. Please select a supported document or image file.', 'Close', { duration: 3000 });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.snackBar.open('File size must be less than 10MB', 'Close', { duration: 3000 });
        return;
      }

      this.selectedFile = file;
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onSave(): void {
    if (this.noteForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.noteForm.value;

    const noteData: NotesDto = {
      title: formValue.title.trim(),
      content: formValue.content.trim()
    };

    if (this.note?.id) {
      // Backend does not support update -> show error
      this.snackBar.open('Update is not supported by backend', 'Close', { duration: 3000 });
      this.isLoading = false;
    } else {
      // Create new note
      if (this.selectedFile) {
        this.noteService.createNoteWithDocument(noteData, this.selectedFile)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (newNote) => {
              this.snackBar.open('Note created successfully', 'Close', { duration: 3000 });
              this.saveNote.emit(newNote);
              this.isLoading = false;
            },
            error: (error) => {
              this.snackBar.open('Failed to create note', 'Close', { duration: 3000 });
              console.error('Error creating note:', error);
              this.isLoading = false;
            }
          });
      } else {
        this.noteService.createNote(noteData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (newNote) => {
              this.snackBar.open('Note created successfully', 'Close', { duration: 3000 });
              this.saveNote.emit(newNote);
              this.isLoading = false;
            },
            error: (error) => {
              this.snackBar.open('Failed to create note', 'Close', { duration: 3000 });
              console.error('Error creating note:', error);
              this.isLoading = false;
            }
          });
      }
    }
  }

  onCancel(): void {
    this.cancelEdit.emit();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.noteForm.controls).forEach(key => {
      const control = this.noteForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.noteForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must not exceed ${maxLength} characters`;
    }
    return '';
  }

  getFileIcon(fileName: string | undefined): string {
    if (!fileName) {
      return 'insert_drive_file';
    }

    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'picture_as_pdf';
      case 'doc':
      case 'docx': return 'description';
      case 'xls':
      case 'xlsx': return 'table_chart';
      case 'ppt':
      case 'pptx': return 'slideshow';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'image';
      case 'txt': return 'text_snippet';
      default: return 'insert_drive_file';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
