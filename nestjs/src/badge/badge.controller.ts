import { Controller, Get, Post, UseGuards, Request, Body } from '@nestjs/common';
import { BadgeService } from './badge.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

@Controller('badges')
@UseGuards(JwtAuthGuard)
export class BadgeController {
  constructor(private readonly badgeService: BadgeService) {}

  @Get('user')
  async getUserBadges(@Request() req) {
    return this.badgeService.getUserBadges(req.user.id);
  }

  @Get('mark-old')
  async markBadgesAsOld(@Request() req) {
    await this.badgeService.markBadgesAsOld(req.user.id);
    return { success: true };
  }

  @Post('award')
  async awardBadge(@Request() req, @Body() body: { badgeId: string }) {
    const success = await this.badgeService.awardSpecificBadge(req.user.id, body.badgeId);
    return { success };
  }

  @Post('create-default')
  async createDefaultBadges() {
    await this.badgeService.createDefaultBadges();
    return { success: true, message: 'Default badges created successfully' };
  }

  @Get('progress')
  async getBadgeProgress(@Request() req) {
    return this.badgeService.getBadgeProgress(req.user.id);
  }

  @Get('stats')
  async getBadgeStats(@Request() req) {
    return this.badgeService.getBadgeStats(req.user.id);
  }
} 