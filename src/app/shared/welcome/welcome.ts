import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './welcome.html',
  styleUrls: ['./welcome.scss']
})
export class Welcome implements OnInit, OnDestroy {
  currentSlide = 0;
  autoSlideInterval: any;

  slides = [
    {
      image: 'assets/slide1.jpg',
      title: 'Learn Anywhere',
      description: 'Access notes, videos, and exams from any device, anytime you need them.',
      backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      buttonText: 'Start Learning'
    },
    {
      image: 'assets/slide2.jpg',
      title: 'Stay Organized',
      description: 'Track your progress across categories and topics with our intuitive dashboard.',
      backgroundColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      buttonText: 'Get Organized'
    },
    {
      image: 'assets/slide3.jpg',
      title: 'Be Exam Ready',
      description: 'Practice with mock exams and prepare with confidence using our comprehensive resources.',
      backgroundColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      buttonText: 'Practice Now'
    }
  ];

  ngOnInit() {
    this.startAutoSlide();
  }

  ngOnDestroy() {
    this.stopAutoSlide();
  }

  startAutoSlide() {
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  stopAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  previousSlide() {
    this.currentSlide =
      this.currentSlide === 0 ? this.slides.length - 1 : this.currentSlide - 1;
  }

  goToSlide(index: number) {
    this.currentSlide = index;
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  onMouseEnter() {
    this.stopAutoSlide();
  }

  onMouseLeave() {
    this.startAutoSlide();
  }

  onImageError(event: any) {
    console.error('Image failed to load:', event.target.src);
    event.target.style.display = 'none';
  }
}