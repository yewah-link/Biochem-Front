// welcome.component.ts
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
      gradient: 'from-amber-700 via-amber-600 to-yellow-700',
      buttonText: 'Start Learning'
    },
    {
      image: 'assets/slide2.jpg',
      title: 'Stay Organized',
      description: 'Track your progress across categories and topics with our intuitive dashboard.',
      gradient: 'from-orange-700 via-amber-700 to-amber-800',
      buttonText: 'Get Organized'
    },
    {
      image: 'assets/slide3.jpg',
      title: 'Be Exam Ready',
      description: 'Practice with mock exams and prepare with confidence using our comprehensive resources.',
      gradient: 'from-yellow-700 via-amber-700 to-orange-700',
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

  getSlideClasses(index: number): string {
    if (index === this.currentSlide) {
      return 'opacity-100 translate-x-0 z-10';
    } else if (index < this.currentSlide) {
      return 'opacity-0 -translate-x-full';
    } else {
      return 'opacity-0 translate-x-full';
    }
  }
}
