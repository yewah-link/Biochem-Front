import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  sidebarOpen = true;
  showCoursesSubmenu = false;
  showContentSubmenu = false;
  mobileMenuOpen = false;
  search: string = '';

  constructor(private router: Router) {}

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    // Close submenus when sidebar closes
    if (!this.sidebarOpen) {
      this.showCoursesSubmenu = false;
      this.showContentSubmenu = false;
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleCoursesSubmenu() {
    this.showCoursesSubmenu = !this.showCoursesSubmenu;
  }

  toggleContentSubmenu() {
    this.showContentSubmenu = !this.showContentSubmenu;
  }

  isCoursesMenuActive(): boolean {
    return this.router.url.includes('/dashboard/courses');
  }

  isContentMenuActive(): boolean {
    return this.router.url.includes('/dashboard/videos') ||
           this.router.url.includes('/dashboard/notes') ||
           this.router.url.includes('/dashboard/exams');
  }

  onSearch() {
    if (this.search.trim()) {
      console.log('Searching for:', this.search);
      // Implement your search logic here
      // Example: this.router.navigate(['/dashboard/search'], { queryParams: { q: this.search } });
    }
  }

  logout() {
    console.log('Logging out...');
    // Implement your logout logic here
    // Example: 
    // this.authService.logout().subscribe(() => {
    //   this.router.navigate(['/login']);
    // });
  }
}