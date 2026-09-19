import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { OnboardingSeeder } from '../seeding/onboarding.seeder';
import {
  LoginQuestion,
  LoginQuestionSchema,
} from './schemas/login-question.schema';
import {
  UserPreference,
  UserPreferenceSchema,
} from './schemas/user-preference.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LoginQuestion.name, schema: LoginQuestionSchema },
      { name: UserPreference.name, schema: UserPreferenceSchema },
    ]),
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService, OnboardingSeeder],
  exports: [OnboardingService],
})
export class OnboardingModule {} 