import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { Welcome } from '../welcome/welcome';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule, Navbar, Footer,Welcome],
  templateUrl: './loader.html',
  styleUrls: ['./loader.scss']
})
export class Loader {}
