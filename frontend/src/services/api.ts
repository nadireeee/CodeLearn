import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Backend URL - development için platform-specific URL'ler
const API_BASE_URL = Platform.select({
  ios: 'http://172.20.10.5:3000',
  android: 'http://172.20.10.5:3000',
  web: 'http://localhost:3000',
  default: 'http://172.20.10.5:3000'
});

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Global logout function
let globalForceLogout: (() => void) | null = null;

// Function to set the logout function
export const setGlobalLogout = (logoutFn: () => void) => {
  globalForceLogout = logoutFn;
};

// Request interceptor - her request'e token ekle
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      // Public endpoint'ler listesi
      const publicEndpoints = [
        '/onboarding/questions',
        '/onboarding/preferences',
        '/auth/login',
        '/auth/signup',
        '/auth/google',
        '/auth/refresh',
        '/user'
      ];
      
      const isPublicEndpoint = publicEndpoints.some(endpoint => 
        config.url?.includes(endpoint)
      );
      
      if (token) {
        console.log('[API] Token: Token var');
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Token yok ve private endpoint ise logout yap
        if (!isPublicEndpoint) {
          console.warn('[API] Token bulunamadı! Private endpoint için logout yapılıyor...');
          
          // Auth data'yı temizle
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
          
          // Global logout fonksiyonunu çağır
          if (globalForceLogout) {
            globalForceLogout();
          }
          
          // Request'i iptal et
          return Promise.reject(new Error('Authentication required'));
        } else {
          console.log('[API] Token: Token yok (public endpoint)');
        }
      }
      
      console.log(`[API] Request: ${config.method?.toUpperCase()} ${config.url}`);
      console.log('[API] Headers:', config.headers);
    } catch (error) {
      console.error('[API] Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    console.error('[API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - token yenileme ve hata yönetimi
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error(`[API] Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
    
    // 401 Unauthorized - Token yenileme dene
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      console.warn('[API] 401 Unauthorized! Token yenileme deneniyor...');
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          console.log('[API] Attempting token refresh...');
          
          // Create a new axios instance for refresh to avoid interceptors
          const refreshApi = axios.create({
            baseURL: API_BASE_URL,
            timeout: 10000,
          });
          
          const response = await refreshApi.post('/auth/refresh', {}, {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          await AsyncStorage.setItem('accessToken', accessToken);
          await AsyncStorage.setItem('refreshToken', newRefreshToken);
          
          // Process queued requests
          processQueue(null, accessToken);
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          console.log('[API] Token refreshed, retrying original request');
          return api(originalRequest);
        } else {
          console.error('[API] Refresh token bulunamadı!');
          processQueue(new Error('No refresh token'));
          throw new Error('No refresh token available');
        }
      } catch (refreshError) {
        console.error('[API] Token refresh failed:', refreshError);
        processQueue(refreshError);
        
        // Refresh token invalid, clear all auth data
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        console.warn('[API] Kullanıcı logout edildi - refresh token geçersiz');
        
        // React Native için doğrudan fonksiyon çağır
        if (globalForceLogout) {
          globalForceLogout();
        }
        
        throw new Error('Authentication failed. Please log in again.');
      } finally {
        isRefreshing = false;
      }
    }
    
    // 500 Server Error - Gemini API veya backend hatası
    if (error.response?.status === 500) {
      console.error('[API] 500 Server Error - Backend/Gemini API hatası');
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Code Files API
export const codeFilesApi = {
  // Get all user files
  getUserFiles: () => api.get('/code-files'),

  // Get specific file
  getFileById: (fileId: string) => api.get(`/code-files/${fileId}`),

  // Create new file
  createFile: (fileData: {
    name: string;
    content: string;
    language?: string;
    isActive?: boolean;
    projectId?: string;
  }) => api.post('/code-files', fileData),

  // Update file
  updateFile: (fileId: string, fileData: {
    name?: string;
    content?: string;
    language?: string;
    isActive?: boolean;
  }) => api.put(`/code-files/${fileId}`, fileData),

  // Delete file
  deleteFile: (fileId: string) => api.delete(`/code-files/${fileId}`),

  // Set active file
  setActiveFile: (fileId: string) => api.put(`/code-files/${fileId}/active`),

  // Save all files
  saveAllFiles: (files: Array<{
    id?: string;
    name: string;
    content: string;
    language: string;
    isActive: boolean;
  }>) => api.post('/code-files/save-all', files),
};

export const analyzeCode = (
  sessionId: string,
  code: string,
  language: 'c' | 'cpp',
  question?: string
) =>
  api.post('/code-intelligence/analyze', { sessionId, code, language, question });

export const chatWithAI = (
  sessionId: string,
  code: string,
  language: 'c' | 'cpp',
  message: string,
  question?: string
) =>
  api.post('/code-intelligence/chat', { sessionId, code, language, message, question });

// Subjects API (Legacy - keeping for compatibility)
export const subjectsApi = {
  // Get all subjects
  getAllSubjects: () => api.get('/subjects'),

  // Get subject by ID
  getSubjectById: (id: string) => api.get(`/subjects/${id}`),

  // Get lessons by subject
  getLessonsBySubject: (subjectId: string) => api.get(`/subjects/${subjectId}/lessons`),

  // Get lesson by ID
  getLessonById: (lessonId: string) => api.get(`/subjects/lesson/${lessonId}`),

  // Get user progress
  getUserProgress: () => api.get('/subjects/progress/user'),

  // Get lesson progress
  getLessonProgress: (lessonId: string) => api.get(`/subjects/progress/lesson/${lessonId}`),

  // Get subject progress
  getSubjectProgress: (subjectId: string) => api.get(`/subjects/progress/subject/${subjectId}`),

  // Mark lesson as completed
  markLessonCompleted: (lessonId: string, score?: number) => {
    console.log('API: markLessonCompleted called with:', { lessonId, score });
    return api.post(`/subjects/lesson/${lessonId}/complete`, { score });
  },

  // Save quiz result
  saveQuizResult: (lessonId: string, quizId: string, answers: string[], correctAnswers: string[]) =>
    api.post(`/subjects/lesson/${lessonId}/quiz/${quizId}`, { answers, correctAnswers }),

  // Get user stats
  getUserStats: () => api.get('/subjects/stats/user'),
};

// New Lessons API - MongoDB based
export const lessonsApi = {
  // Get chapters
  getChapters: (language: 'c' | 'cpp', locale: 'tr' | 'en') => 
    api.get(`/lessons/chapters?language=${language}&locale=${locale}`),

  // Get chapter by ID
  getChapter: (id: string, language: 'c' | 'cpp', locale: 'tr' | 'en') => 
    api.get(`/lessons/chapters/${id}?language=${language}&locale=${locale}`),

  // Get topics by chapter
  getTopicsByChapter: (chapterId: string, language: 'c' | 'cpp', locale: 'tr' | 'en') => 
    api.get(`/lessons/chapters/${chapterId}/topics?language=${language}&locale=${locale}`),

  // Get topic by ID
  getTopic: (id: string, language: 'c' | 'cpp', locale: 'tr' | 'en') => 
    api.get(`/lessons/topics/${id}?language=${language}&locale=${locale}`),

  // Get lessons by topic
  getLessonsByTopic: (topicId: string, language: 'c' | 'cpp', locale: 'tr' | 'en') => 
    api.get(`/lessons/topics/${topicId}/lessons?language=${language}&locale=${locale}`),

  // Get lesson by ID
  getLesson: (id: string, language: 'c' | 'cpp', locale: 'tr' | 'en') => 
    api.get(`/lessons/lessons/${id}?language=${language}&locale=${locale}`),

  // Get next lesson
  getNextLesson: (language: 'c' | 'cpp', locale: 'tr' | 'en') => 
    api.get(`/lessons/next?language=${language}&locale=${locale}`),

  // Mark lesson as completed
  markLessonCompleted: (lessonId: string, language: 'c' | 'cpp', locale: 'tr' | 'en') => 
    api.post(`/lessons/lessons/complete`, { lessonId, language, locale }),

  // Get user progress
  getUserProgress: (language: 'c' | 'cpp', locale: 'tr' | 'en') => 
    api.get(`/lessons/progress?language=${language}&locale=${locale}`),

  // Submit chapter test
  submitChapterTest: (testId: string, answers: number[], language: 'c' | 'cpp', locale: 'tr' | 'en') => 
    api.post(`/lessons/tests/${testId}/submit?language=${language}&locale=${locale}`, { answers }),

  // Get chapter test
  getChapterTest: (testId: string, language: 'c' | 'cpp', locale: 'tr' | 'en') => 
    api.get(`/lessons/tests/${testId}?language=${language}&locale=${locale}`),

  // Check if user can access lesson
  canAccessLesson: (lessonId: string, language: 'c' | 'cpp', locale: 'tr' | 'en') => 
    api.get(`/lessons/lessons/${lessonId}/can-access?language=${language}&locale=${locale}`),
};

// Code Intelligence API
export const codeIntelligenceApi = {
  // Start session
  startSession: (data: { userId: string; lessonId?: string }) =>
    api.post('/code-intelligence/start-session', data),

  // Analyze code
  analyzeCode: (sessionId: string, code: string, language: 'c' | 'cpp', question?: string) =>
    api.post('/code-intelligence/analyze', { sessionId, code, language, question }),

  // Get code completion
  getCodeCompletion: (sessionId: string, code: string, language: 'c' | 'cpp') =>
    api.post('/code-intelligence/completion', { sessionId, code, language }),

  // Get error fixes
  getErrorFixes: (sessionId: string, code: string, language: 'c' | 'cpp', errors: string[]) =>
    api.post('/code-intelligence/fixes', { sessionId, code, language, errors }),

  // Chat with AI
  chatWithAI: (sessionId: string, code: string, language: 'c' | 'cpp', message: string) =>
    api.post('/code-intelligence/chat', { sessionId, code, language, message }),

  // Get session statistics
  getSessionStats: (sessionId: string) => api.get(`/code-intelligence/session/${sessionId}/stats`),
};

// Quiz API
export const quizApi = {
  // Get all quizzes
  getAllQuizzes: () => 
    api.get('/quiz/all'),

  // Debug: Get all quizzes without filters
  debugAllQuizzes: () => 
    api.get('/quiz/debug/all'),

  // Get quizzes by skill and subject
  getQuizzesBySkill: (skillId: string, subjectId: string) => 
    api.get(`/quiz/skill/${skillId}/subject/${subjectId}`),

  // Get quiz by ID
  getQuizById: (quizId: string) => 
    api.get(`/quiz/${quizId}`),

  // Start quiz
  startQuiz: (quizId: string) => 
    api.post(`/quiz/${quizId}/start`),

  // Submit answer
  submitAnswer: (quizId: string, data: {
    questionId: string;
    userAnswer: string | number;
    timeSpent: number;
    hintsUsed?: number;
  }) => 
    api.post(`/quiz/${quizId}/answer`, data),

  // Complete quiz
  completeQuiz: (quizId: string) => 
    api.post(`/quiz/${quizId}/complete`),

  // Get user progress - backend endpoint ile uyumlu
  getUserProgress: () => api.get('/quiz/progress'),

  // Get user progress by skill
  getUserProgressBySkill: (skillId: string) => api.get(`/quiz/progress/${skillId}`),

  // Get user stats
  getUserStats: () => api.get('/quiz/stats/user'),
};

// English Quiz API
export const quizEngApi = {
  // Get all English quizzes
  getAllQuizzes: () => 
    api.get('/quiz-eng/all'),

  // Debug: Get all English quizzes without filters
  debugAllQuizzes: () => 
    api.get('/quiz-eng/debug/all'),

  // Get English quizzes by skill and subject
  getQuizzesBySkill: (skillId: string, subjectId: string) => 
    api.get(`/quiz-eng/skill/${skillId}/subject/${subjectId}`),

  // Get English quiz by ID
  getQuizById: (quizId: string) => 
    api.get(`/quiz-eng/${quizId}`),

  // Start English quiz
  startQuiz: (quizId: string) => 
    api.post(`/quiz-eng/${quizId}/start`),

  // Submit answer for English quiz
  submitAnswer: (quizId: string, data: {
    questionId: string;
    userAnswer: string | number;
    timeSpent: number;
    hintsUsed?: number;
  }) => 
    api.post(`/quiz-eng/${quizId}/answer`, data),

  // Complete English quiz
  completeQuiz: (quizId: string) => 
    api.post(`/quiz-eng/${quizId}/complete`),

  // Get user progress for English quizzes
  getUserProgress: () => api.get('/quiz-eng/progress'),

  // Get user stats for English quizzes
  getUserStats: () => api.get('/quiz-eng/stats/user'),
};

export const getAllQuizzes = async () => {
  return api.get('/quiz/all');
};

// 🎖️ Badge API - Modern Badge System
export const badgeApi = {
  // Get user badges
  getUserBadges: () => api.get('/badges/user'),

  // Get badge progress (unlockable badges)
  getBadgeProgress: () => api.get('/badges/progress'),

  // Get badge statistics
  getBadgeStats: () => api.get('/badges/stats'),

  // Mark badges as old (remove NEW indicator)
  markBadgesAsOld: () => api.get('/badges/mark-old'),

  // Award specific badge (admin)
  awardBadge: (badgeId: string) => api.post('/badges/award', { badgeId }),

  // Create default badges (admin)
  createDefaultBadges: () => api.post('/badges/create-default'),
}; 