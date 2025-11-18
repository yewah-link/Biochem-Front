import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QuestionService, QuestionDto, ChoiceDto } from '../../../core/question.service';

@Component({
  selector: 'app-question-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './question-edit.html',
  styleUrls: ['./question-edit.scss']
})
export class QuestionEdit implements OnInit {
  questionForm!: FormGroup;
  examId!: number;
  questionId?: number;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  questionTypes = [
    { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
    { value: 'WRITTEN', label: 'Written' }  // ✅ Changed to match backend
  ];

  constructor(
    private fb: FormBuilder,
    private questionService: QuestionService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get examId from route params
    this.route.params.subscribe(params => {
      this.examId = parseInt(params['examId'], 10);
      this.questionId = params['id'] ? parseInt(params['id'], 10) : undefined;
      this.isEditMode = !!this.questionId;

      this.initializeForm();

      if (this.isEditMode && this.questionId) {
        this.loadQuestion(this.questionId);
      }
    });
  }

  initializeForm(): void {
    this.questionForm = this.fb.group({
      text: ['', [Validators.required, Validators.minLength(5)]],
      type: ['MULTIPLE_CHOICE', Validators.required],
      marks: [1, [Validators.required, Validators.min(1)]],
      choices: this.fb.array([])
    });

    // Add default choices for multiple choice
    this.addChoice();
    this.addChoice();

    // Watch for type changes
    this.questionForm.get('type')?.valueChanges.subscribe(type => {
      this.handleQuestionTypeChange(type);
    });
  }

  get choices(): FormArray {
    return this.questionForm.get('choices') as FormArray;
  }

  createChoiceFormGroup(choice?: ChoiceDto): FormGroup {
    return this.fb.group({
      id: [choice?.id || null],
      choiceText: [choice?.choiceText || '', Validators.required],  // ✅ Changed from 'text' to 'choiceText'
      correct: [choice?.correct || false]  // ✅ Changed from 'isCorrect' to 'correct'
    });
  }

  addChoice(): void {
    this.choices.push(this.createChoiceFormGroup());
  }

  removeChoice(index: number): void {
    if (this.choices.length > 2) {
      this.choices.removeAt(index);
    }
  }

  handleQuestionTypeChange(type: string): void {
    // Clear existing choices
    this.choices.clear();

    if (type === 'MULTIPLE_CHOICE') {
      // Add 4 default choices for multiple choice
      for (let i = 0; i < 4; i++) {
        this.addChoice();
      }
    } else if (type === 'WRITTEN') {
      // Written questions don't need choices
      // Keep choices array empty
    }
  }

  loadQuestion(id: number): void {
    this.isLoading = true;
    this.questionService.getQuestionById(id).subscribe({
      next: (question: QuestionDto) => {
        this.questionForm.patchValue({
          text: question.text,
          type: question.type,
          marks: question.marks
        });

        // Load choices
        this.choices.clear();
        if (question.choices && question.choices.length > 0) {
          question.choices.forEach(choice => {
            this.choices.push(this.createChoiceFormGroup(choice));
          });
        }

        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load question';
        this.isLoading = false;
        console.error('Error loading question:', error);
      }
    });
  }

  setCorrectAnswer(index: number): void {
    const type = this.questionForm.get('type')?.value;
    
    if (type === 'MULTIPLE_CHOICE') {
      // Uncheck all other choices
      this.choices.controls.forEach((control, i) => {
        control.get('correct')?.setValue(i === index);  // ✅ Changed from 'isCorrect' to 'correct'
      });
    }
  }

  onSubmit(): void {
    if (this.questionForm.invalid) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    const type = this.questionForm.get('type')?.value;

    // Validate that at least one correct answer is selected for MC
    if (type === 'MULTIPLE_CHOICE') {
      const hasCorrectAnswer = this.choices.controls.some(
        control => control.get('correct')?.value === true  // ✅ Changed from 'isCorrect' to 'correct'
      );

      if (!hasCorrectAnswer) {
        this.errorMessage = 'Please select at least one correct answer';
        return;
      }
    }

    this.isSaving = true;
    this.errorMessage = '';

    const questionData: QuestionDto = {
      text: this.questionForm.get('text')?.value,
      type: this.questionForm.get('type')?.value,
      marks: this.questionForm.get('marks')?.value,
      examId: this.examId,
      choices: type === 'MULTIPLE_CHOICE' 
        ? this.choices.value 
        : []
    };

    const saveOperation = this.isEditMode && this.questionId
      ? this.questionService.updateQuestion(this.questionId, questionData)
      : this.questionService.addQuestion(this.examId, questionData);

    saveOperation.subscribe({
      next: () => {
        this.successMessage = this.isEditMode 
          ? 'Question updated successfully!' 
          : 'Question added successfully!';
        
        setTimeout(() => {
          this.router.navigate(['/dashboard/exams', this.examId, 'questions']);
        }, 1500);
      },
      error: (error) => {
        this.errorMessage = 'Failed to save question. Please try again.';
        this.isSaving = false;
        console.error('Error saving question:', error);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/dashboard/exams', this.examId, 'questions']);
  }

  get showChoices(): boolean {
    const type = this.questionForm.get('type')?.value;
    return type === 'MULTIPLE_CHOICE';  // ✅ Only show for MULTIPLE_CHOICE
  }
}