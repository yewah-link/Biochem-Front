import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CategoryDto, CategoryService, GenericResponseV2 } from '../../../core/category.service';

@Component({
  selector: 'app-category-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-edit.html',
  styleUrls: ['./category-edit.scss']
})
export class CategoryEdit implements OnInit {
  // Form related properties
  categoryForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  categoryId?: number;

  // For display purposes
  pageTitle = 'Add Category';
  submitButtonText = 'Add Category';

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Check route params to determine if we're adding or editing
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.categoryId = +params['id'];
        this.isEditMode = true;
        this.pageTitle = 'Edit Category';
        this.submitButtonText = 'Update Category';
        this.loadCategory();
      } else {
        this.isEditMode = false;
        this.pageTitle = 'Add Category';
        this.submitButtonText = 'Add Category';
      }
    });
  }

  /**
   * Initialize the reactive form with validators
   */
  private initializeForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  /**
   * Load category data for editing
   */
  loadCategory(): void {
    if (!this.categoryId) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.categoryService.getById(this.categoryId).subscribe({
      next: (response: GenericResponseV2<CategoryDto>) => {
        if (response.status === 'SUCCESS' && response._embedded) {
          const category = response._embedded;
          this.categoryForm.patchValue({
            name: category.name ?? '',
            description: category.description ?? ''
          });
          this.pageTitle = `Edit ${category.name}`;
        } else {
          this.errorMessage = response.message || 'Failed to load category';
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading category:', err);
        this.errorMessage = 'Failed to load category';
        this.isLoading = false;
      }
    });
  }

  /**
   * Submit form - either add new or update existing category
   */
  onSubmit(): void {
    if (this.categoryForm.invalid) return;

    this.isSaving = true;
    this.errorMessage = '';

    const formData = this.categoryForm.value;

    const operation = this.isEditMode && this.categoryId
      ? this.categoryService.update(this.categoryId, formData)
      : this.categoryService.add(formData);

    operation.subscribe({
      next: (response: GenericResponseV2<CategoryDto>) => {
        if (response.status === 'SUCCESS') {
          // Navigate back to list after successful save
          this.router.navigate(['/dashboard/categories']);
        } else {
          this.errorMessage = response.message || 'Save failed';
        }
        this.isSaving = false;
      },
      error: (err) => {
        console.error('Error saving category:', err);

        // Enhanced error handling for your backend structure
        if (err.error && typeof err.error === 'object') {
          if (err.error.status === 'FAILED' && err.error.message) {
            this.errorMessage = err.error.message;
          } else if (err.error.message) {
            this.errorMessage = err.error.message;
          } else {
            this.errorMessage = `Server error: ${err.status} - ${err.statusText}`;
          }
        } else if (err.error && typeof err.error === 'string') {
          this.errorMessage = err.error;
        } else {
          this.errorMessage = `Failed to save category (${err.status}: ${err.statusText})`;
        }

        this.isSaving = false;
      }
    });
  }

  /**
   * Reset form to initial state
   */
  onReset(): void {
    if (this.isEditMode && this.categoryId) {
      // Reload original data in edit mode
      this.loadCategory();
    } else {
      // Clear form in add mode
      this.categoryForm.reset();
    }
  }

  /**
   * Cancel and navigate back to list
   */
  onCancel(): void {
    this.router.navigate(['/dashboard/categories']);
  }

  /**
   * Navigate back to categories list
   */
  goBack(): void {
    this.router.navigate(['/dashboard/categories']);
  }

  // Form Control Getters
  get name() {
    return this.categoryForm.get('name');
  }

  get description() {
    return this.categoryForm.get('description');
  }

  /**
   * Get validation error message for name field
   */
  getNameErrorMessage(): string {
    const control = this.name;
    if (control?.hasError('required')) return 'Category name is required';
    if (control?.hasError('minlength')) return 'Name must be at least 2 characters';
    if (control?.hasError('maxlength')) return 'Name cannot exceed 100 characters';
    return '';
  }

  /**
   * Get validation error message for description field
   */
  getDescriptionErrorMessage(): string {
    const control = this.description;
    if (control?.hasError('maxlength')) return 'Description cannot exceed 500 characters';
    return '';
  }
}
