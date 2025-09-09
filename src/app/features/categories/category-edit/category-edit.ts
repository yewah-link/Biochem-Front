import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CategoryDto, CategoryService, GenericResponseV2 } from '../../../core/category.service';

type ViewMode = 'list' | 'form' | 'details';

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

  // List related properties - Fix: Make sure it's never undefined
  categories: CategoryDto[] = [];   // This ensures it's never undefined
  selectedCategory: CategoryDto | null = null;

  // View state
  currentView: ViewMode = 'list';
  pageTitle = 'Categories';
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
    this.loadCategories();

    // Handle route params for /add or /edit/:id
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.categoryId = +params['id'];
        this.isEditMode = true;
        this.currentView = 'form';
        this.loadCategory();
      } else if (this.route.snapshot.url.some(segment => segment.path === 'add')) {
        this.currentView = 'form';
        this.isEditMode = false;
      }
    });
  }

  private initializeForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  // List Management Methods
  loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.categoryService.getAll().subscribe({
      next: (response: GenericResponseV2<CategoryDto[]>) => {
        // Fix: Ensure categories is never undefined
        this.categories = response.status === 'SUCCESS' && response._embedded ? response._embedded : [];
        if (response.status !== 'SUCCESS') {
          this.errorMessage = response.message || 'Failed to fetch categories';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.errorMessage = 'Failed to load categories';
        this.categories = []; // Ensure it's always an array
        this.isLoading = false;
      }
    });
  }

  onCategoryClick(category: CategoryDto): void {
    this.selectedCategory = category;
    this.currentView = 'details';
    this.pageTitle = category.name;
  }

  onAdd(): void {
    this.isEditMode = false;
    this.currentView = 'form';
    this.pageTitle = 'Add Category';
    this.submitButtonText = 'Add Category';
    this.categoryForm.reset();
    this.categoryId = undefined;
    this.selectedCategory = null;
  }

  onEdit(categoryId: number): void {
    this.categoryId = categoryId;
    this.isEditMode = true;
    this.currentView = 'form';
    this.pageTitle = 'Edit Category';
    this.submitButtonText = 'Update Category';
    this.loadCategory();
  }

  onDelete(id: number): void {
    if (!confirm('Are you sure you want to delete this category?')) return;

    this.categoryService.delete(id).subscribe({
      next: (response: GenericResponseV2<void>) => {
        if (response.status === 'SUCCESS') {
          this.loadCategories();
          if (this.selectedCategory?.id === id) {
            this.goToList();
          }
        } else {
          this.errorMessage = response.message || 'Delete failed';
        }
      },
      error: (err) => {
        console.error('Error deleting category:', err);
        this.errorMessage = 'Failed to delete category';
      }
    });
  }

  // Navigation Methods
  goToList(): void {
    this.currentView = 'list';
    this.pageTitle = 'Categories';
    this.selectedCategory = null;
    this.categoryForm.reset();
    this.errorMessage = '';
  }

  goToDetails(): void {
    if (this.selectedCategory) {
      this.currentView = 'details';
      this.pageTitle = this.selectedCategory.name;
    }
  }

  // Form Management Methods
  loadCategory(): void {
    if (!this.categoryId) return;

    this.isLoading = true;
    this.categoryService.getById(this.categoryId).subscribe({
      next: (response: GenericResponseV2<CategoryDto>) => {
        if (response.status === 'SUCCESS' && response._embedded) {
          const category = response._embedded;
          this.categoryForm.patchValue({
            name: category.name ?? '',
            description: category.description ?? ''
          });
          this.pageTitle = this.isEditMode ? `Edit ${category.name}` : 'Category Details';
          this.selectedCategory = category;
        } else {
          this.errorMessage = response.message || 'Failed to fetch category';
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

  onSubmit(): void {
    if (this.categoryForm.invalid) return;

    this.isSaving = true;
    this.errorMessage = '';

    const formData = this.categoryForm.value;
    
    // Debug: Log the data being sent
    console.log('Sending category data:', formData);

    const operation = this.isEditMode && this.categoryId
      ? this.categoryService.update(this.categoryId, formData)
      : this.categoryService.add(formData);

    operation.subscribe({
      next: (response: GenericResponseV2<CategoryDto>) => {
        console.log('Backend response:', response);
        if (response.status === 'SUCCESS') {
          this.loadCategories();
          this.goToList();
        } else {
          this.errorMessage = response.message || 'Save failed';
        }
        this.isSaving = false;
      },
      error: (err) => {
        console.error('HTTP Error details:', {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          message: err.message
        });
        
        // Enhanced error handling for your backend structure
        if (err.error && typeof err.error === 'object') {
          // Your backend returns GenericResponseV2 even on errors
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

  onReset(): void {
    if (this.isEditMode && this.categoryId) {
      this.loadCategory();
    } else {
      this.categoryForm.reset();
    }
  }

  onCancel(): void {
    if (this.selectedCategory && this.isEditMode) {
      this.goToDetails();
    } else {
      this.goToList();
    }
  }

  // Form Helper Methods
  get name() { return this.categoryForm.get('name'); }
  get description() { return this.categoryForm.get('description'); }

  getNameErrorMessage(): string {
    const control = this.name;
    if (control?.hasError('required')) return 'Category name is required';
    if (control?.hasError('minlength')) return 'Name must be at least 2 characters';
    if (control?.hasError('maxlength')) return 'Name cannot exceed 100 characters';
    return '';
  }

  getDescriptionErrorMessage(): string {
    const control = this.description;
    if (control?.hasError('maxlength')) return 'Description cannot exceed 500 characters';
    return '';
  }

  trackByCategory(index: number, category: CategoryDto): number {
    return category.id ?? index;
  }
}