import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from "./shared/navbar/navbar";
import { Footer } from "./shared/footer/footer";
import { Dashboard } from "./features/admin/dashboard/dashboard";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, Dashboard],
  template: `
  
    <app-navbar></app-navbar>
    <app-dashboard></app-dashboard>
    <app-footer></app-footer>
    <router-outlet />

  `,
  styles: [],
})
export class App {
  protected title = 'biochem-ui';
}
