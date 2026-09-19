import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  LoginQuestion,
  LoginQuestionDocument,
} from './schemas/login-question.schema';
import {
  UserPreference,
  UserPreferenceDocument,
} from './schemas/user-preference.schema';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectModel(LoginQuestion.name)
    private readonly loginQuestionModel: Model<LoginQuestionDocument>,
    @InjectModel(UserPreference.name)
    private readonly userPreferenceModel: Model<UserPreferenceDocument>,
  ) {}

  async getOnboardingQuestions(): Promise<LoginQuestion[]> {
    return this.loginQuestionModel.find().exec();
  }

  async saveUserPreferences(
    userId: string,
    preferences: Record<string, any>,
  ): Promise<UserPreference> {
    const filter = { userId };
    const update = {
      $set: {
        userId,
        preferences,
        hasCompletedOnboarding: true,
      },
    };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    return this.userPreferenceModel.findOneAndUpdate(filter, update, options);
  }

  async checkOnboardingStatus(userId: string): Promise<UserPreference | null> {
    return this.userPreferenceModel.findOne({ userId }).exec();
  }

  async getUserPreferences(userId: string): Promise<Record<string, any>> {
    try {
      const userPreference = await this.userPreferenceModel.findOne({ userId }).exec();
      return userPreference?.preferences || {};
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {};
    }
  }
} 