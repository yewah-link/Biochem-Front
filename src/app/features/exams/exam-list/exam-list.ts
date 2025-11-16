import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ExamDto, ExamService } from '../../../core/exam.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-list.html',
  styleUrls: ['./exam-list.scss']
})
export class ExamList implements OnInit {
  // View states
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Data
  exams: ExamDto[] = [];
  deletingIds = new Set<number>();

  constructor(
    private examService: ExamService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadExams();
  }

  loadExams(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.examService.getAllExams().subscribe({
      next: (exams: ExamDto[]) => {
        this.exams = exams || [];
        this.errorMessage = '';
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load exams. Please try again.';
        this.isLoading = false;
        console.error('Error loading exams:', error);
      }
    });
  }

  createExam(): void {
    this.router.navigate(['/dashboard/exams/add']);
  }

  editExam(exam: ExamDto): void {
    this.router.navigate(['/dashboard/exams/edit', exam.id]);
  }

  addQuestions(exam: ExamDto): void {
    this.router.navigate(['/dashboard/exams', exam.id, 'questions', 'add']);
  }

  viewQuestions(exam: ExamDto): void {
    this.router.navigate(['/dashboard/exams', exam.id, 'questions']);
  }

  editQuestions(exam: ExamDto): void {
    this.router.navigate(['/dashboard/exams', exam.id, 'questions', 'edit']);
  }

  deleteExam(id: number): void {
    if (!confirm('Are you sure you want to delete this exam?')) {
      return;
    }

    this.deletingIds.add(id);

    this.examService.deleteExamById(id).subscribe({
      next: () => {
        this.exams = this.exams.filter(e => e.id !== id);
        this.successMessage = 'Exam deleted successfully';
        setTimeout(() => this.successMessage = '', 3000);
        this.deletingIds.delete(id);
      },
      error: (error) => {
        this.errorMessage = 'Failed to delete exam. Please try again.';
        setTimeout(() => this.errorMessage = '', 3000);
        this.deletingIds.delete(id);
        console.error('Error deleting exam:', error);
      }
    });
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';

    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  }

  retryLoad(): void {
    this.loadExams();
  }
}