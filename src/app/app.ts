// app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from './core/auth/auth.service';
import { Navbar } from './shared/navbar/navbar';   // Import Navbar
import { Footer } from './shared/footer/footer';   // Import Footer

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, Navbar, Footer],
  template: `
    @if (!auth.isLoggedIn()) {
      <!-- Navbar visible only before login -->
      <app-navbar></app-navbar>

      <div class="auth-container">
        <router-outlet></router-outlet>
      </div>

      <!-- Footer visible only before login -->
      <app-footer></app-footer>
    } @else {
      <div class="dashboard-container">
        <router-outlet></router-outlet>
      </div>
    }
  `,
  styles: [`
    .auth-container {
      min-height: calc(100vh - 120px); /* leave space for navbar + footer */
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .dashboard-container {
      min-height: 100vh;
      background-color: #f5f5f5;
    }
  `]
})
export class App {
  constructor(public auth: Auth) {}
}
