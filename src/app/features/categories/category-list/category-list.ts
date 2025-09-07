import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CategoryDto, CategoryService, GenericResponseV2 } from '../../../core/category.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './category-list.html',
  styleUrls: ['./category-list.scss']
})
export class CategoryListComponent implements OnInit {
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

  loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.categoryService.getAll().subscribe({
      next: (response: GenericResponseV2<CategoryDto[]>) => {
        if (response.status === 'SUCCESS') {
          this.categories = response.data;
        } else {
          this.errorMessage = response.message;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.errorMessage = 'Failed to load categories';
        this.isLoading = false;
      }
    });
  }

  onDelete(id: number): void {
    if (confirm('Are you sure you want to delete this category?')) {
      this.categoryService.delete(id).subscribe({
        next: (response: GenericResponseV2<void>) => {
          if (response.status === 'SUCCESS') {
            this.loadCategories();
          } else {
            this.errorMessage = response.message;
          }
        },
        error: (err) => {
          console.error('Error deleting category:', err);
          this.errorMessage = 'Failed to delete category';
        }
      });
    }
  }

  onEdit(id: number): void {
    this.router.navigate(['/categories/edit', id]);
  }

  onAdd(): void {
    this.router.navigate(['/categories/add']);
  }

  trackByCategory(index: number, category: CategoryDto): number {
    return category.id ?? index;
  }
}
