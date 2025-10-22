import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
  showContentSubmenu = false;
  mobileMenuOpen = false;
  search: string = '';

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleContentSubmenu() {
    this.showContentSubmenu = !this.showContentSubmenu;
  }

  onSearch() {
    if (this.search.trim()) {
      console.log('Searching for:', this.search);
      // Implement your search logic here
      // Example: this.router.navigate(['/search'], { queryParams: { q: this.search } });
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