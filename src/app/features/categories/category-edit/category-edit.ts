import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CategoryService, CategoryDto } from '../../../core/category.service';

@Component({
  selector: 'app-category-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './category-edit.html',
  styleUrls: ['./category-edit.scss']
})
export class CategoryEdit implements OnInit {
  categoryForm: FormGroup;
  categoryId?: number;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.categoryForm = this.createForm();
  }

  ngOnInit(): void {
    // Check if we have route params, if not just show the add form
    try {
      this.route.params.subscribe(params => {
        if (params['id']) {
          this.categoryId = +params['id'];
          this.isEditMode = true;
          this.loadCategory();
        }
        // If no params (direct usage), just show the add form - do nothing
      });
    } catch (error) {
      // If route.params fails (when not using router), just show add form
      console.log('No route params available, showing add form');
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        this.whitespaceValidator
      ]],
      description: ['', [
        Validators.maxLength(500)
      ]]
    });
  }

  private whitespaceValidator(control: AbstractControl) {
    if (control.value && control.value.trim().length === 0) {
      return { whitespace: true };
    }
    return null;
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Edit Category' : 'Add Category';
  }

  get submitButtonText(): string {
    if (this.isSaving) {
      return this.isEditMode ? 'Updating...' : 'Saving...';
    }
    return this.isEditMode ? 'Update Category' : 'Save Category';
  }

  get name() { return this.categoryForm.get('name'); }
  get description() { return this.categoryForm.get('description'); }

  loadCategory(): void {
    if (!this.categoryId) return;

    this.isLoading = true;
    this.categoryService.getById(this.categoryId).subscribe({
      next: (response) => {
        if (response.status === 'SUCCESS') {
          this.categoryForm.patchValue({
            name: response.data.name,
            description: response.data.description
          });
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load category data.';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const categoryData: CategoryDto = {
      name: this.categoryForm.value.name.trim(),
      description: this.categoryForm.value.description?.trim()
    };

    const request = this.isEditMode && this.categoryId
      ? this.categoryService.update(this.categoryId, categoryData)
      : this.categoryService.add(categoryData);

    request.subscribe({
      next: (response) => {
        if (response.status === 'SUCCESS') {
          // For now, just show success message instead of navigating
          alert('Category saved successfully!');
          this.categoryForm.reset();
        }
        this.isSaving = false;
      },
      error: () => {
        this.errorMessage = 'Failed to save category. Please try again.';
        this.isSaving = false;
      }
    });
  }

  onReset(): void {
    if (this.categoryForm.dirty) {
      const confirmed = window.confirm('Are you sure you want to reset the form? All changes will be lost.');
      if (!confirmed) return;
    }
    
    this.categoryForm.reset();
    this.errorMessage = '';
  }

  onCancel(): void {
    if (this.categoryForm.dirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    
    // For now, just reset the form instead of navigating
    this.categoryForm.reset();
    this.errorMessage = '';
  }

  markFormGroupTouched(): void {
    Object.keys(this.categoryForm.controls).forEach(key => {
      const control = this.categoryForm.get(key);
      control?.markAsTouched();
    });
  }

  getNameErrorMessage(): string {
    const control = this.name;
    if (control?.hasError('required')) return 'Category name is required.';
    if (control?.hasError('minlength')) return 'Category name must be at least 2 characters.';
    if (control?.hasError('whitespace')) return 'Category name cannot be only whitespace.';
    return '';
  }

  getDescriptionErrorMessage(): string {
    const control = this.description;
    if (control?.hasError('maxlength')) return 'Description cannot exceed 500 characters.';
    return '';
  }
}