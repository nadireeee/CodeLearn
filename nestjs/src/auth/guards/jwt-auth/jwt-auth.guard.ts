import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from 'src/auth/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);
  
  constructor(private reflector: Reflector) {
    super();
  }
  
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      this.logger.log('Public endpoint - authentication bypassed');
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    
    this.logger.log(`[JWT] Request to: ${request.method} ${request.url}`);
    this.logger.log(`[JWT] Authorization Header: ${authHeader ? 'Present' : 'Missing'}`);
    
    if (!authHeader) {
      this.logger.warn('[JWT] Authorization header missing!');
      throw new UnauthorizedException('Authorization header missing');
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      this.logger.warn('[JWT] Invalid authorization header format!');
      throw new UnauthorizedException('Invalid authorization header format');
    }
    
    const token = authHeader.substring(7);
    this.logger.log(`[JWT] Token present: ${token ? 'Yes' : 'No'}`);
    
    return super.canActivate(context);
  }
  
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      this.logger.error('[JWT] Authentication failed:', err || info);
      throw new UnauthorizedException('Invalid or expired token');
    }
    
    this.logger.log(`[JWT] Authentication successful for user: ${user.id}`);
    return user;
  }
}
