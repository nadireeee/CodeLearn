// Quiz Types - Backend API integration

export interface SkillLevel {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  isLocked: boolean;
  isCompleted: boolean;
  progress: number; // 0-100
  totalLessons: number;
  completedLessons: number;
  xpReward: number;
  crownLevel: number; // 0-5 (Duolingo crowns)
  lessonTypes: string[]; // 'matching', 'ordering', 'fill-in-the-blank', 'multiple-choice', 'code-completion', 'output-prediction'
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // minutes
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  isLocked: boolean;
  isCompleted: boolean;
  progress: number;
  skillLevels: SkillLevel[];
  totalXp: number;
  totalCrowns: number;
  requiredLevel: number; // Bu seviyeyi açmak için gereken kullanıcı seviyesi
  category: 'basics' | 'intermediate' | 'advanced' | 'expert';
}

export interface UserStats {
  totalXp: number;
  totalCrowns: number;
  currentStreak: number;
  longestStreak: number;
  totalLessonsCompleted: number;
  totalSubjectsCompleted: number;
  level: number;
  levelProgress: number;
  hearts: number;
  gems: number;
  dailyGoal: number;
  dailyProgress: number;
  lastLoginDate: string;
  totalStudyTime: number; // minutes
  averageScore: number;
  perfectLessons: number;
  streakFreeze: number;
  doubleXp: boolean;
  doubleXpExpiresAt?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'daily' | 'milestone' | 'special' | 'streak' | 'perfect' | 'speed';
  isUnlocked: boolean;
  unlockedAt?: string;
  rewardXp: number;
  rewardGems: number;
  progress: number;
  maxProgress: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Lesson {
  id: string;
  skillId: string;
  subjectId: string;
  type: 'matching' | 'ordering' | 'fill-in-the-blank' | 'multiple-choice' | 'code-completion' | 'output-prediction';
  title: string;
  description: string;
  content: any; // Lesson specific content
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // minutes
  xpReward: number;
  isCompleted: boolean;
  score?: number;
  completedAt?: string;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'matching' | 'fill-in-the-blank' | 'code-completion' | 'output-prediction';
  question: string;
  options?: string[];
  pairs?: { left: string; right: string }[];
  codeTemplate?: string;
  correctAnswer: string | number;
  explanation: string;
  points: number;
  hints?: string[];
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  skillId: string;
  subjectId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  xpReward: number;
  questions: QuizQuestion[];
  isActive: boolean;
  totalAttempts: number;
  averageScore: number;
  perfectCompletions: number;
}

export interface QuizProgress {
  userId: string;
  quizId: string;
  skillId: string;
  subjectId: string;
  isCompleted: boolean;
  score: number;
  totalScore: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  xpEarned: number;
  heartsUsed: number;
  streak: number;
  answers: QuizAnswer[];
  startedAt: Date;
  completedAt?: Date;
  attempts: number;
  isPerfect: boolean;
}

export interface QuizAnswer {
  questionId: string;
  userAnswer: string | number;
  correctAnswer: string | number;
  isCorrect: boolean;
  timeSpent: number;
  hintsUsed: number;
} 