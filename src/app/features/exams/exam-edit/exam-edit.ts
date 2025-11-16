import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService, CategoryDto } from '../../../core/category.service';
import { ExamService, ExamDto } from '../../../core/exam.service';
import { CourseService } from '../../../core/course.service';

@Component({
  selector: 'app-exam-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './exam-edit.html',
  styleUrls: ['./exam-edit.scss']
})
export class ExamEdit implements OnInit {
  examForm: FormGroup;
  categories: CategoryDto[] = [];
  isEditMode = false;
  examId?: number;
  courseId?: number;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private examService: ExamService,
    private categoryService: CategoryService,
    private courseService: CourseService,
    private route: ActivatedRoute,
    public router: Router
  ) {
    this.examForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Check route params for exam ID (for edit mode)
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.examId = parseInt(params['id'], 10);
        this.isEditMode = true;
      }
    });

    // Check query parameters - courseId is REQUIRED for creating new exams
    this.route.queryParams.subscribe(params => {
      if (!this.isEditMode && !params['courseId']) {
        this.errorMessage = 'Course ID is required. Redirecting...';
        setTimeout(() => {
          this.router.navigate(['/dashboard/courses']);
        }, 2000);
        return;
      }

      if (params['courseId']) {
        this.courseId = parseInt(params['courseId'], 10);
      }
    });

    this.loadCategories();

    if (this.isEditMode && this.examId) {
      this.loadExam();
    }
  }

  loadCategories() {
    this.categoryService.getAll().subscribe({
      next: (res) => {
        if (res.status === 'SUCCESS') {
          this.categories = res._embedded;
        }
      }
    });
  }

  loadExam() {
    this.examService.getExamById(this.examId!).subscribe({
      next: (exam: ExamDto) => {
        this.examForm.patchValue({
          title: exam.title,
          description: exam.description
        });
      },
      error: (error) => {
        console.error('Error loading exam:', error);
      }
    });
  }

  onSubmit() {
    if (this.examForm.valid) {
      // Validate that courseId exists for creating new exam
      if (!this.isEditMode && !this.courseId) {
        this.errorMessage = 'Course ID is required to create an exam.';
        return;
      }

      this.isLoading = true;
      this.errorMessage = '';
      const formValue = this.examForm.value;
      
      // Create exam DTO with required fields
      const examDto: any = {
        title: formValue.title,
        description: formValue.description || '',
        totalMarks: 0,
        passingMarks: 0,
        durationMinutes: 0,
        orderIndex: 0,
        isPublished: false,
        courseId: this.courseId // Required field for backend
      };

      if (this.isEditMode) {
        // Update existing exam
        this.examService.updateExam(this.examId!, examDto).subscribe({
          next: (exam: ExamDto) => {
            this.isLoading = false;
            this.navigateBack();
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = 'Failed to update exam: ' + (error.error?.message || error.message);
            console.error('Error updating exam:', error);
          }
        });
      } else {
        // Create new exam
        this.examService.createExam(examDto).subscribe({
          next: (exam: any) => {
            console.log('Exam created successfully:', exam);
            this.isLoading = false;
            
            // Redirect to add questions
            if (exam.id) {
              this.router.navigate(['/dashboard/exams', exam.id, 'questions', 'add'], {
                queryParams: { courseId: this.courseId }
              });
            } else {
              this.errorMessage = 'Exam created but ID is missing';
            }
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = 'Failed to create exam: ' + (error.error?.message || error.message);
            console.error('Error creating exam:', error);
          }
        });
      }
    }
  }

  // Navigate back to courses
  navigateBack() {
    this.router.navigate(['/dashboard/courses']);
  }
}