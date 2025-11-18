import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router'; // ✅ Add ActivatedRoute
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
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  exams: ExamDto[] = [];
  deletingIds = new Set<number>();
  
  
  courseId?: number;
  courseName?: string;
  isFilteredByCourse = false;

  constructor(
    private examService: ExamService,
    private router: Router,
    private route: ActivatedRoute // ✅ Add this
  ) {}

  ngOnInit(): void {
    // Check for courseId in query params
    this.route.queryParams.subscribe(params => {
      if (params['courseId']) {
        this.courseId = parseInt(params['courseId'], 10);
        this.courseName = params['courseName'] || 'Unknown Course';
        this.isFilteredByCourse = true;
      }
      this.loadExams();
    });
  }

  loadExams(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Use existing service method based on courseId
    const examObservable = this.courseId 
      ? this.examService.getExamsByCourse(this.courseId)  //  Filter by course
      : this.examService.getAllExams();                   //  Get all exams

    examObservable.subscribe({
      next: (exams: ExamDto[]) => {
        this.exams = exams || [];
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
    // ✅ Pass courseId when creating from course context
    if (this.courseId) {
      this.router.navigate(['/dashboard/exams/add'], {
        queryParams: { 
          courseId: this.courseId,
          courseName: this.courseName
        }
      });
    } else {
      this.router.navigate(['/dashboard/exams/add']);
    }
  }

  editExam(exam: ExamDto): void {
    //  Pass courseId when editing
    this.router.navigate(['/dashboard/exams/edit', exam.id], {
      queryParams: { 
        courseId: this.courseId || exam.courseId,
        courseName: this.courseName || exam.courseName
      }
    });
  }

  //  Navigate back to course
  backToCourse(): void {
    if (this.courseId) {
      this.router.navigate(['/dashboard/courses', this.courseId]);
    }
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