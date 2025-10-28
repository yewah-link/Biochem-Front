import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, UserDto } from '../../../core/auth/auth.service';

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
export class Dashboard implements OnInit {
  sidebarOpen = true;
  showCoursesSubmenu = false;
  showContentSubmenu = false;
  mobileMenuOpen = false;
  search: string = '';
  currentUser: UserDto | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Subscribe to current user changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  get userDisplayName(): string {
    return this.authService.getUserDisplayName();
  }

  get userRole(): string {
    if (this.currentUser?.role) {
      return this.currentUser.role === 'ADMIN' ? 'Administrator' : 'Student';
    }
    return 'User';
  }

  get userInitials(): string {
    return this.authService.getUserInitials();
  }

  get userProfilePhoto(): string | undefined {
    return this.currentUser?.profilePhotoUrl;
  }

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
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Logout error:', err);
        // Force logout even on error
        this.router.navigate(['/login']);
      }
    });
  }
}