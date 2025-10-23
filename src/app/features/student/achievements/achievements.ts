import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  rarity: 'gold' | 'silver' | 'bronze';
  points: number;
  unlockedDate: string;
}

interface Badge {
  id: number;
  title: string;
  description: string;
  icon: string;
  rarity: 'gold' | 'silver' | 'bronze';
  locked: boolean;
  progress?: number;
}

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './achievements.html',
  styleUrl: './achievements.scss'
})
export class Achievements implements OnInit {
  totalPoints = 1250;
  unlockedBadges = 12;
  currentStreak = 7;
  rank = '#42';

  recentAchievements: Achievement[] = [
    {
      id: 1,
      title: 'Quiz Master',
      description: 'Scored 100% on 5 quizzes',
      icon: '🏆',
      rarity: 'gold',
      points: 100,
      unlockedDate: '2 days ago'
    },
    {
      id: 2,
      title: 'Speed Learner',
      description: 'Completed 10 videos in one day',
      icon: '⚡',
      rarity: 'silver',
      points: 50,
      unlockedDate: '5 days ago'
    },
    {
      id: 3,
      title: 'First Steps',
      description: 'Completed your first course',
      icon: '🎓',
      rarity: 'bronze',
      points: 25,
      unlockedDate: '1 week ago'
    }
  ];

  allBadges: Badge[] = [
    {
      id: 1,
      title: 'Quiz Master',
      description: 'Score 100% on 5 quizzes',
      icon: '🏆',
      rarity: 'gold',
      locked: false
    },
    {
      id: 2,
      title: 'Video Watcher',
      description: 'Watch 50 videos',
      icon: '📺',
      rarity: 'silver',
      locked: false,
      progress: 100
    },
    {
      id: 3,
      title: 'Note Taker',
      description: 'Create 20 study notes',
      icon: '📝',
      rarity: 'bronze',
      locked: false
    },
    {
      id: 4,
      title: 'Consistent Learner',
      description: '7 day learning streak',
      icon: '🔥',
      rarity: 'gold',
      locked: false
    },
    {
      id: 5,
      title: 'Course Completer',
      description: 'Complete 5 courses',
      icon: '✅',
      rarity: 'gold',
      locked: true,
      progress: 60
    },
    {
      id: 6,
      title: 'Early Bird',
      description: 'Study before 8 AM',
      icon: '🌅',
      rarity: 'bronze',
      locked: false
    },
    {
      id: 7,
      title: 'Night Owl',
      description: 'Study after 10 PM',
      icon: '🦉',
      rarity: 'bronze',
      locked: false
    },
    {
      id: 8,
      title: 'Social Learner',
      description: 'Join 5 study groups',
      icon: '👥',
      rarity: 'silver',
      locked: true,
      progress: 40
    },
    {
      id: 9,
      title: 'Test Ace',
      description: 'Pass 10 tests',
      icon: '💯',
      rarity: 'gold',
      locked: true,
      progress: 30
    },
    {
      id: 10,
      title: 'Fast Finisher',
      description: 'Complete a course in 1 week',
      icon: '🚀',
      rarity: 'silver',
      locked: true
    }
  ];

  ngOnInit(): void {
    // Load user achievements
  }
}