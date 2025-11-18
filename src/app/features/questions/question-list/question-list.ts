import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { QuestionService, QuestionDto } from '../../../core/question.service';

@Component({
  selector: 'app-question-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './question-list.html',
  styleUrls: ['./question-list.scss']
})
export class QuestionList implements OnInit {
  examId!: number;
  questions: QuestionDto[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  deletingIds = new Set<number>();

  constructor(
    private questionService: QuestionService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get examId from route params
    this.route.params.subscribe(params => {
      this.examId = parseInt(params['examId'], 10);
      this.loadQuestions();
    });
  }

  loadQuestions(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.questionService.getQuestionsByExam(this.examId).subscribe({
      next: (questions: QuestionDto[]) => {
        this.questions = questions || [];
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load questions. Please try again.';
        this.isLoading = false;
        console.error('Error loading questions:', error);
      }
    });
  }

  addQuestion(): void {
    this.router.navigate(['/dashboard/exams', this.examId, 'questions', 'add']);
  }

  editQuestion(questionId: number): void {
    this.router.navigate(['/dashboard/exams', this.examId, 'questions', 'edit', questionId]);
  }

  deleteQuestion(questionId: number): void {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    this.deletingIds.add(questionId);

    this.questionService.deleteQuestionById(questionId).subscribe({
      next: () => {
        this.questions = this.questions.filter(q => q.id !== questionId);
        this.successMessage = 'Question deleted successfully';
        setTimeout(() => this.successMessage = '', 3000);
        this.deletingIds.delete(questionId);
      },
      error: (error) => {
        this.errorMessage = 'Failed to delete question. Please try again.';
        setTimeout(() => this.errorMessage = '', 3000);
        this.deletingIds.delete(questionId);
        console.error('Error deleting question:', error);
      }
    });
  }

  backToExams(): void {
    this.router.navigate(['/dashboard/exams']);
  }

  getQuestionTypeLabel(type: string | undefined): string {
    const typeMap: { [key: string]: string } = {
      'MULTIPLE_CHOICE': 'Multiple Choice',
      'WRITTEN': 'Written'  // ✅ Changed from TRUE_FALSE, SHORT_ANSWER, ESSAY
    };
    return type ? typeMap[type] || type : 'Unknown';
  }

  getQuestionTypeIcon(type: string | undefined): string {
    const iconMap: { [key: string]: string } = {
      'MULTIPLE_CHOICE': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      'WRITTEN': 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
    };
    return type ? iconMap[type] || iconMap['MULTIPLE_CHOICE'] : iconMap['MULTIPLE_CHOICE'];
  }

  getCorrectAnswersText(question: QuestionDto): string {
    if (!question.choices || question.choices.length === 0) {
      return 'N/A';
    }

    const correctChoices = question.choices.filter(c => c.correct);  // ✅ Changed from 'isCorrect' to 'correct'
    if (correctChoices.length === 0) {
      return 'Not set';
    }

    return correctChoices.map(c => c.choiceText).join(', ');  // ✅ Changed from 'text' to 'choiceText'
  }

  retryLoad(): void {
    this.loadQuestions();
  }
}