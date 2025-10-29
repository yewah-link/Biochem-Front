// note-edit.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotesDto, NoteService } from '../../../core/note.service';
import { CourseDto, CourseService } from '../../../core/course.service';

@Component({
  selector: 'app-note-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './note-edit.html',
  styleUrl: './note-edit.scss'
})
export class NoteEdit implements OnInit {
  noteForm!: FormGroup;
  note: NotesDto | null = null;
  selectedFile: File | null = null;
  
  // Edit mode properties
  isEditMode = false;
  noteId: number | null = null;
  
  // Course-specific properties (REQUIRED)
  courseId: number | null = null;
  courseName: string = '';
  
  // View states
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private noteService: NoteService,
    private courseService: CourseService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // Check route params for note ID (for edit mode)
    // If ID exists in URL (/dashboard/notes/:id), it's edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.noteId = +params['id'];
        this.isEditMode = true;
        console.log('Edit mode - Note ID:', this.noteId);
      } else {
        console.log('Create mode - No note ID');
      }
    });

    // Check query parameters - courseId is REQUIRED
    this.route.queryParams.subscribe(params => {
      if (!params['courseId']) {
        this.errorMessage = 'Course ID is required. Redirecting...';
        setTimeout(() => {
          this.router.navigate(['/dashboard/courses']);
        }, 2000);
        return;
      }

      this.courseId = +params['courseId'];
      this.noteForm.patchValue({ courseId: this.courseId });

      if (params['courseName']) {
        this.courseName = params['courseName'];
      }

      console.log('Course context:', { courseId: this.courseId, courseName: this.courseName });
    });

    // Load note for editing if in edit mode
    if (this.isEditMode && this.noteId) {
      this.loadNote();
    }
  }

  private initForm(): void {
    this.noteForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.maxLength(5000)]],
      courseId: ['', Validators.required],
      orderIndex: [null]
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
          courseId: note.courseId,
          orderIndex: note.orderIndex
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading note:', error);
        this.errorMessage = 'Failed to load note: ' + error.message;
        this.isLoading = false;
        this.backToCourse();
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
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.ppt', '.pptx', '.rtf', '.odt', '.ods', '.odp'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

      if (!allowedExtensions.includes(fileExtension)) {
        this.errorMessage = 'File type not supported. Please choose a valid document file.';
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

    if (!this.courseId) {
      this.errorMessage = 'Course ID is required';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.noteForm.value;
    const noteData: NotesDto = {
      title: formValue.title,
      content: formValue.content,
      courseId: this.courseId,
      orderIndex: formValue.orderIndex
    };

    let saveObservable;

    if (this.isEditMode && this.noteId) {
      // UPDATE existing note
      saveObservable = this.noteService.updateNote(this.noteId, noteData);
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

        setTimeout(() => {
          this.backToCourse();
        }, 1500);
      },
      error: (error) => {
        const action = this.isEditMode ? 'update' : 'create';
        this.errorMessage = `Failed to ${action} note: ${error.message || 'Unknown error'}`;
        this.isLoading = false;
      }
    });
  }

  backToCourse(): void {
    if (this.courseId) {
      this.router.navigate(['/dashboard/courses', this.courseId]);
    } else {
      this.router.navigate(['/dashboard/courses']);
    }
  }

  // Use NoteService helpers
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
      case 'courseId': return 'Course';
      case 'orderIndex': return 'Order';
      default: return field.charAt(0).toUpperCase() + field.slice(1);
    }
  }

  hasError(field: string): boolean {
    const control = this.noteForm.get(field);
    return !!(control?.errors && control.touched);
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Edit Note' : 'Create New Note';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Update Note' : 'Create Note';
  }
}