// dashboard.component.ts
import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CategoryDto, CategoryService } from '../../../core/category.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    MatToolbarModule,
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.scss'
})
export class StudentDashboard implements OnInit {
  mobileSearchActive = false;
  isLoggedIn = true;
  userName = 'Alex';

  @ViewChild('categoryTrack') categoryTrack!: ElementRef;

  categories: { label: string; slug: string }[] = []; // ✅ Initially empty

  constructor(private categoryService: CategoryService) {}

  ngOnInit() {
    this.categoryService.getAll().subscribe({
      next: (res) => {
        if (res.status === 'SUCCESS') {
          this.categories = res._embedded.map((cat: CategoryDto) => ({
            label: cat.name,
            slug: cat.name.toLowerCase().replace(/\s+/g, '-') // slug-friendly format
          }));
        }
      },
      error: (err) => {
        console.error('Failed to load categories', err);
      }
    });
  }

  scrollCategories(direction: 'left' | 'right') {
    const element = this.categoryTrack.nativeElement;
    const scrollAmount = 150;
    element.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  }

  logout() {
    this.isLoggedIn = false;
  }
}
