// New Lessons System Types - MongoDB based

export type Language = 'c' | 'cpp';
export type Locale = 'tr' | 'en';

// Content Types
export interface LessonContent {
  type: 'text' | 'code' | 'video' | 'image' | 'warning' | 'note' | 'tip' | 'example' | 'exercise' | 'quiz';
  value?: string;
  language?: string;
  url?: string;
  caption?: string;
  title?: string;
  question?: string;
  options?: string[];
  answer?: string;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
}

// Chapter Entity
export interface Chapter {
  _id: string;
  entityType: 'chapter';
  order: number;
  title: string;
  description: string;
  objectives: string[];
  estimatedTime: number;
  topics: string[]; // Topic IDs
  testId?: string; // Chapter test ID
  createdAt: Date;
  updatedAt: Date;
}

// Topic Entity
export interface Topic {
  _id: string;
  entityType: 'topic';
  chapterId: string;
  order: number;
  title: string;
  description: string;
  objectives: string[];
  estimatedTime: number;
  lessons: string[]; // Lesson IDs
  createdAt: Date;
  updatedAt: Date;
}

// Lesson Entity
export interface Lesson {
  _id: string;
  entityType: 'lesson';
  chapterId: string;
  topicId: string;
  order: number;
  title: string;
  description: string;
  content: LessonContent[];
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Chapter Test Entity
export interface ChapterTest {
  _id: string;
  entityType: 'chapter_test';
  chapterId: string;
  title: string;
  description: string;
  questions: TestQuestion[];
  timeLimit: number;
  passingScore: number;
  createdAt: Date;
  updatedAt: Date;
}

// Test Question
export interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
}

// User Lesson Progress
export interface UserLessonProgress {
  _id: string;
  userId: string;
  lessonId: string;
  chapterId: string;
  topicId: string;
  isCompleted: boolean;
  completedAt?: Date;
  score?: number;
  timeSpent: number;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ChaptersResponse {
  chapters: Chapter[];
  total: number;
}

export interface TopicsResponse {
  topics: Topic[];
  total: number;
}

export interface LessonsResponse {
  lessons: Lesson[];
  total: number;
}

export interface LessonResponse {
  lesson: Lesson;
  userProgress?: UserLessonProgress;
  canAccess: boolean;
}

export interface ChapterTestResponse {
  test: ChapterTest;
  userProgress?: {
    isCompleted: boolean;
    score?: number;
    completedAt?: Date;
  };
}

export interface UserProgressResponse {
  progress: UserLessonProgress[];
  statistics: {
    totalLessons: number;
    completedLessons: number;
    totalChapters: number;
    completedChapters: number;
    totalTopics: number;
    completedTopics: number;
    totalTimeSpent: number;
    averageScore: number;
  };
}

// Query Types
export interface LessonQueryDto {
  language: Language;
  locale: Locale;
}

export interface SubmitTestDto {
  testId: string;
  language: Language;
  locale: Locale;
  answers: number[];
}

// Navigation Types
export interface LessonNavigationParams {
  lessonId: string;
  language: Language;
  locale: Locale;
}

export interface ChapterNavigationParams {
  chapterId: string;
  language: Language;
  locale: Locale;
}

export interface TopicNavigationParams {
  topicId: string;
  language: Language;
  locale: Locale;
} 