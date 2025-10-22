import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CategoryDto, CategoryService, GenericResponseV2 } from '../../../core/category.service';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './category-list.html',
  styleUrls: ['./category-list.scss']
})
export class CategoryList implements OnInit {
  categories: CategoryDto[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  /**
   * Fetch all categories from backend
   */
  loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.categoryService.getAll().subscribe({
      next: (response: GenericResponseV2<CategoryDto[]>) => {
        if (response.status === 'SUCCESS' && response._embedded) {
          this.categories = response._embedded;
        } else {
          this.errorMessage = response.message || 'Failed to fetch categories';
          this.categories = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading categories:', err);

        // Enhanced error handling for your backend structure
        if (err.error && typeof err.error === 'object') {
          if (err.error.status === 'ERROR' && err.error.message) {
            this.errorMessage = err.error.message;
          } else if (err.error.message) {
            this.errorMessage = err.error.message;
          } else {
            this.errorMessage = `Server error: ${err.status} - ${err.statusText}`;
          }
        } else if (err.error && typeof err.error === 'string') {
          this.errorMessage = err.error;
        } else {
          this.errorMessage = 'Failed to load categories';
        }

        this.categories = [];
        this.isLoading = false;
      }
    });
  }

  /**
   * Handle click on a category card → navigate to edit page
   */
  onCategoryClick(category: CategoryDto): void {
    if (category.id) {
      this.router.navigate(['/dashboard/categories/edit', category.id]);
    }
  }

  /**
   * Delete a category
   */
  onDelete(id: number): void {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    this.categoryService.delete(id).subscribe({
      next: (response: GenericResponseV2<void>) => {
        if (response.status === 'SUCCESS') {
          // Reload categories after successful deletion
          this.loadCategories();
        } else {
          this.errorMessage = response.message || 'Failed to delete category';
        }
      },
      error: (err) => {
        console.error('Error deleting category:', err);

        // Enhanced error handling
        if (err.error && typeof err.error === 'object') {
          if (err.error.status === 'ERROR' && err.error.message) {
            this.errorMessage = err.error.message;
          } else if (err.error.message) {
            this.errorMessage = err.error.message;
          } else {
            this.errorMessage = `Server error: ${err.status} - ${err.statusText}`;
          }
        } else if (err.error && typeof err.error === 'string') {
          this.errorMessage = err.error;
        } else {
          this.errorMessage = 'Failed to delete category';
        }
      }
    });
  }

  /**
   * Navigate to the edit screen for the selected category
   */
  onEdit(id: number): void {
    this.router.navigate(['/dashboard/categories/edit', id]);
  }

  /**
   * Navigate to the add new category form
   */
  onAdd(): void {
    this.router.navigate(['/dashboard/categories/add']);
  }

  /**
   * TrackBy function for ngFor to improve rendering performance
   */
  trackByCategory(index: number, category: CategoryDto): number {
    return category.id ?? index;
  }
}
