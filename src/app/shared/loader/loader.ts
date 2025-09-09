import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../navbar/navbar';   // adjust path
import { Footer } from '../footer/footer';   // adjust path

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule, Navbar, Footer],
  templateUrl: './loader.html',
  styleUrls: ['./loader.scss']
})
export class Loader {}
