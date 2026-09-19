import api from './api';

export interface QuestionOption {
  value: string;
  label: string;
}

export interface OnboardingQuestion {
  _id: string; 
  key: string;
  text: string;
  options: QuestionOption[];
}

export interface OnboardingStatus {
    hasCompletedOnboarding: boolean;
}

class OnboardingService {
  async getOnboardingStatus(): Promise<OnboardingStatus> {
    try {
      const response = await api.get('/onboarding/status');
      return response.data;
    } catch (error) {
      console.error('Failed to get onboarding status:', error);
      throw error;
    }
  }

  async getOnboardingQuestions(): Promise<OnboardingQuestion[]> {
    try {
      const response = await api.get('/onboarding/questions');
      return response.data;
    } catch (error) {
      console.error('Failed to get onboarding questions:', error);
      throw error;
    }
  }

  async saveOnboardingPreferences(preferences: Record<string, any>): Promise<any> {
    try {
      const response = await api.post('/onboarding/preferences', { preferences });
      return response.data;
    } catch (error) {
      console.error('Failed to save onboarding preferences:', error);
      throw error;
    }
  }
}

export default new OnboardingService(); 