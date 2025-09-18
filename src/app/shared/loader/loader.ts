import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { Welcome } from '../welcome/welcome';
import { VideoPreview } from '../video-preview/video-preview';


@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule, Navbar, Footer, Welcome, VideoPreview],
  templateUrl: './loader.html',
  styleUrls: ['./loader.scss']
})
export class Loader {}
