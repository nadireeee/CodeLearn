import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { User } from 'src/entities/user.entity';
import { SavePreferencesDto } from './dto/save-preferences.dto';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Public()
  @Get('questions')
  async getOnboardingQuestions() {
    return this.onboardingService.getOnboardingQuestions();
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async checkOnboardingStatus(@CurrentUser() user: User) {
    const preference = await this.onboardingService.checkOnboardingStatus(
      user.id,
    );
    return {
      hasCompletedOnboarding: preference?.hasCompletedOnboarding || false,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('preferences')
  async getUserPreferences(@CurrentUser() user: User) {
    const preferences = await this.onboardingService.getUserPreferences(user.id);
    return {
      preferences: preferences,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('preferences')
  @HttpCode(HttpStatus.OK)
  async saveUserPreferences(
    @CurrentUser() user: User,
    @Body() savePreferencesDto: SavePreferencesDto,
  ) {
    return this.onboardingService.saveUserPreferences(
      user.id,
      savePreferencesDto.preferences,
    );
  }
}
