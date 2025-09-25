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
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private examService: ExamService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    public router: Router
  ) {
    this.examForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      categoryId: ['', Validators.required]
    });
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.examId = idParam ? +idParam : undefined;
    this.isEditMode = !!this.examId;

    this.loadCategories();

    if (this.isEditMode) {
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
      next: (response) => {
        if (response.status === 'SUCCESS') {
          const exam = response._embedded;
          this.examForm.patchValue({
            title: exam.title,
            description: exam.description,
            categoryId: exam.category.id
          });
        }
      }
    });
  }

  onSubmit() {
    if (this.examForm.valid) {
      const formValue = this.examForm.value;
      const examDto: ExamDto = {
        title: formValue.title,
        description: formValue.description,
        category: { id: formValue.categoryId, name: '' }
      };

      const operation = this.isEditMode
        ? this.examService.updateExam(this.examId!, examDto)
        : this.examService.createExam(examDto);

      operation.subscribe({
        next: (response) => {
          if (response.status === 'SUCCESS') {
            this.router.navigate(['/dashboard/exams']);
          }
        }
      });
    }
  }
}
