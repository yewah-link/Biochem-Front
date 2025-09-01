import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from "./shared/navbar/navbar";
import { Footer } from "./shared/footer/footer";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  template: `
  
    <app-navbar></app-navbar>
    <app-footer></app-footer>
    <router-outlet />

  `,
  styles: [],
})
export class App {
  protected title = 'biochem-ui';
}
