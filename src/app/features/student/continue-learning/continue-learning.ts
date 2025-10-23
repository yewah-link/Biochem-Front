import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

interface RecentVideo {
  id: number;
  title: string;
  course: string;
  duration: string;
  watchProgress: number;
  lastWatched: string;
}

interface Recommendation {
  id: number;
  title: string;
  category: string;
  duration: string;
}

interface WeeklyGoal {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

@Component({
  selector: 'app-continue-learning',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './continue-learning.html',
  styleUrl: './continue-learning.scss'
})
export class ContinueLearning implements OnInit {
  selectedVideo: RecentVideo | null = null;

  recentVideos: RecentVideo[] = [
    {
      id: 1,
      title: 'Protein Folding Mechanisms',
      course: 'Protein Structure',
      duration: '15:32',
      watchProgress: 65,
      lastWatched: '2 hours ago'
    },
    {
      id: 2,
      title: 'Enzyme Inhibition Types',
      course: 'Enzyme Kinetics',
      duration: '12:45',
      watchProgress: 100,
      lastWatched: '1 day ago'
    },
    {
      id: 3,
      title: 'Glycolysis Overview',
      course: 'Cellular Metabolism',
      duration: '18:20',
      watchProgress: 40,
      lastWatched: '2 days ago'
    }
  ];

  recommendations: Recommendation[] = [
    {
      id: 1,
      title: 'Advanced Protein Structures',
      category: 'Protein Chemistry',
      duration: '14:25'
    },
    {
      id: 2,
      title: 'Enzyme Regulation',
      category: 'Enzymology',
      duration: '16:50'
    },
    {
      id: 3,
      title: 'TCA Cycle Details',
      category: 'Metabolism',
      duration: '20:15'
    },
    {
      id: 4,
      title: 'DNA Repair Mechanisms',
      category: 'Molecular Biology',
      duration: '13:30'
    }
  ];

  weeklyGoals: WeeklyGoal[] = [
    {
      id: 1,
      title: 'Complete Protein Structure Module',
      description: 'Finish all 12 videos and pass the quiz',
      completed: false
    },
    {
      id: 2,
      title: 'Watch 5 Videos on Metabolism',
      description: 'Continue with cellular metabolism course',
      completed: true
    },
    {
      id: 3,
      title: 'Take Practice Test',
      description: 'Test your knowledge on enzyme kinetics',
      completed: false
    },
    {
      id: 4,
      title: 'Review Notes',
      description: 'Go through all saved notes from this week',
      completed: false
    }
  ];

  ngOnInit(): void {
    // Load user's learning progress
    this.loadUserProgress();
  }

  openVideo(video: RecentVideo): void {
    this.selectedVideo = video;
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  closeVideo(): void {
    this.selectedVideo = null;
    // Restore body scroll
    document.body.style.overflow = 'auto';
  }

  openRecommendation(recommendation: Recommendation): void {
    // Convert recommendation to video format for the player
    const videoToPlay: RecentVideo = {
      id: recommendation.id,
      title: recommendation.title,
      course: recommendation.category,
      duration: recommendation.duration,
      watchProgress: 0,
      lastWatched: 'Not watched yet'
    };
    this.openVideo(videoToPlay);
  }

  toggleGoal(goal: WeeklyGoal): void {
    goal.completed = !goal.completed;
    // Optionally save to backend
    this.saveGoalProgress(goal);
  }

  private loadUserProgress(): void {
    // Load user's learning progress from backend
    // this.apiService.getUserProgress().subscribe(data => {
    //   this.recentVideos = data.recentVideos;
    //   this.recommendations = data.recommendations;
    //   this.weeklyGoals = data.weeklyGoals;
    // });
  }

  private saveGoalProgress(goal: WeeklyGoal): void {
    // Save goal progress to backend
    // this.apiService.updateGoal(goal).subscribe();
    console.log('Goal updated:', goal);
  }
}
