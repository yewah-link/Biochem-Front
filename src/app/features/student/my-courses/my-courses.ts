import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Course {
  id: number;
  title: string;
  description: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'not-started';
  videoCount: number;
  duration: string;
}

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-courses.html',
  styleUrl: './my-courses.scss'
})
export class MyCourses implements OnInit {
  enrolledCourses = 8;
  completedCourses = 3;
  inProgressCourses = 5;

  courses: Course[] = [
    {
      id: 1,
      title: 'Protein Structure',
      description: 'Learn about primary, secondary, tertiary, and quaternary protein structures',
      progress: 75,
      status: 'in-progress',
      videoCount: 12,
      duration: '3h 20m'
    },
    {
      id: 2,
      title: 'Enzyme Kinetics',
      description: 'Master enzyme kinetics, inhibition, and regulation mechanisms',
      progress: 100,
      status: 'completed',
      videoCount: 15,
      duration: '4h 15m'
    },
    {
      id: 3,
      title: 'Cellular Metabolism',
      description: 'Explore glycolysis, TCA cycle, and oxidative phosphorylation',
      progress: 45,
      status: 'in-progress',
      videoCount: 20,
      duration: '5h 30m'
    },
    {
      id: 4,
      title: 'DNA Replication',
      description: 'Understand DNA replication mechanisms and repair processes',
      progress: 0,
      status: 'not-started',
      videoCount: 10,
      duration: '2h 45m'
    },
    {
      id: 5,
      title: 'Lipid Biochemistry',
      description: 'Study lipid structure, metabolism, and signaling pathways',
      progress: 60,
      status: 'in-progress',
      videoCount: 14,
      duration: '3h 50m'
    },
    {
      id: 6,
      title: 'Molecular Genetics',
      description: 'Learn gene expression, regulation, and genetic engineering',
      progress: 100,
      status: 'completed',
      videoCount: 18,
      duration: '4h 40m'
    }
  ];

  ngOnInit(): void {
    this.calculateStats();
  }

  calculateStats(): void {
    this.enrolledCourses = this.courses.length;
    this.completedCourses = this.courses.filter(c => c.status === 'completed').length;
    this.inProgressCourses = this.courses.filter(c => c.status === 'in-progress').length;
  }
}