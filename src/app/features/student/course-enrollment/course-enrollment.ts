// course-enrollment.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CourseService, CourseDto } from '../../../core/course.service';
import { CourseEnrollmentService } from '../../../core/course-enrollment.service';
import { AuthService } from '../../../core/auth/auth.service';

interface Feature {
  icon: string;
  text: string;
}

interface LearningOutcome {
  text: string;
}

interface CurriculumSection {
  title: string;
  lectures: number;
  duration: string;
  topics: string[];
  expanded?: boolean;
}

@Component({
  selector: 'app-course-enrollment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-enrollment.html',
  styleUrl: './course-enrollment.scss'
})
export class CourseEnrollment implements OnInit {
  courseId: number = 0;
  course: CourseDto | null = null;
  loading: boolean = true;
  activeTab: string = 'overview';
  isEnrolled: boolean = false;
  enrolling: boolean = false;
  userId: number = 0;

  features: Feature[] = [
    { icon: '🎥', text: '42 hours on-demand video' },
    { icon: '📄', text: '28 downloadable resources' },
    { icon: '🏆', text: 'Certificate of completion' },
    { icon: '♾️', text: 'Full lifetime access' }
  ];

  learningOutcomes: LearningOutcome[] = [
    { text: 'Understand the structure and function of biological macromolecules' },
    { text: 'Master metabolic pathways including glycolysis and TCA cycle' },
    { text: 'Analyze enzyme kinetics and regulation mechanisms' },
    { text: 'Explore DNA replication, transcription, and translation' },
    { text: 'Study membrane transport and cellular signaling' },
    { text: 'Apply biochemical principles to real-world problems' }
  ];

  curriculum: CurriculumSection[] = [
    {
      title: 'Introduction to Biochemistry',
      lectures: 8,
      duration: '2h 30m',
      topics: ['Chemical Foundations', 'Water and pH', 'Amino Acids', 'Protein Structure'],
      expanded: false
    },
    {
      title: 'Enzymes and Catalysis',
      lectures: 12,
      duration: '4h 15m',
      topics: ['Enzyme Kinetics', 'Inhibition', 'Regulation', 'Cofactors'],
      expanded: false
    },
    {
      title: 'Metabolism and Energy',
      lectures: 15,
      duration: '5h 45m',
      topics: ['Glycolysis', 'TCA Cycle', 'Electron Transport', 'ATP Synthesis'],
      expanded: false
    },
    {
      title: 'Molecular Biology',
      lectures: 10,
      duration: '3h 50m',
      topics: ['DNA Structure', 'Replication', 'Transcription', 'Translation'],
      expanded: false
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private enrollmentService: CourseEnrollmentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
  const user = this.authService.getCurrentUserValue();

  if (!user || !user.id) {
    // User not logged in, redirect to login
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url }
    });
    return;
  }

  this.userId = user.id;

  this.route.params.subscribe(params => {
    this.courseId = +params['id'];
    if (this.courseId) {
      this.loadCourse();
      this.checkEnrollmentStatus();
    }
  });
}

  loadCourse(): void {
    this.loading = true;
    this.courseService.getCourseById(this.courseId).subscribe({
      next: (course) => {
        this.course = course;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading course:', error);
        this.loading = false;
      }
    });
  }

  checkEnrollmentStatus(): void {
    this.enrollmentService.isUserEnrolled(this.userId, this.courseId).subscribe({
      next: (enrolled) => {
        this.isEnrolled = enrolled;
      },
      error: (error) => {
        console.error('Error checking enrollment:', error);
      }
    });
  }

  enrollInCourse(): void {
    if (this.enrolling) return;

    this.enrolling = true;
    this.enrollmentService.enrollInCourse(this.userId, this.courseId).subscribe({
      next: (enrollment) => {
        this.isEnrolled = true;
        this.enrolling = false;
        alert('Successfully enrolled in course!');
        this.router.navigate(['/student/my-courses']);
      },
      error: (error) => {
        console.error('Error enrolling:', error);
        this.enrolling = false;
        alert('Failed to enroll in course. Please try again.');
      }
    });
  }

  addToWishlist(): void {
    alert('Added to wishlist!');
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  toggleSection(index: number): void {
    this.curriculum[index].expanded = !this.curriculum[index].expanded;
  }

  getCourseImage(): string {
  if(this.course && (this.course as any).thumbnailUrl){
    return this.courseService.getCourseThumbnailUrl(this.course)
  }
  return 'assets/images/course-placeholder.png';
  }

  getRating(): number {
    return 4.8; // This should come from the backend
  }

  getReviewCount(): number {
    return 12543; // This should come from the backend
  }

  getStudentCount(): number {
    return 45678; // This should come from the backend
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
