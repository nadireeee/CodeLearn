import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { UserService } from 'src/user/user.service';
import { AuthJwtPayload } from './types/auth-jwtPayload';
import refreshJwtConfig from './config/refresh-jwt.config';
import { ConfigType } from '@nestjs/config';
import * as argon2 from 'argon2';
import { CurrentUser } from './types/current-user';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { OAuth2Client } from 'google-auth-library';
import googleOauthConfig from './config/google-oauth.config';

@Injectable()
export class AuthService {
  private oauthClient: OAuth2Client;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @Inject(refreshJwtConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,
    @Inject(googleOauthConfig.KEY)
    private googleConfig: ConfigType<typeof googleOauthConfig>,
  ) {
    this.oauthClient = new OAuth2Client(
      this.googleConfig.clientId,
      this.googleConfig.clientSecret,
    );
  }

  async validateUser(email: string, password: string) {
    console.log('🔐 Validating user:', { email, password: '[HIDDEN]' });
    
    const user = await this.userService.findByEmail(email);
    if (!user) {
      console.log('❌ User not found:', email);
      throw new UnauthorizedException('User not found!');
    }
    
    const isPasswordMatch = await compare(password, user.password);
    if (!isPasswordMatch) {
      console.log('❌ Invalid password for user:', email);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('✅ User validated successfully:', { id: user.id, email: user.email });
    return { id: user.id };
  }

  async login(userId: string) {
    const { accessToken, refreshToken } = await this.generateTokens(userId);
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.userService.updateHashedRefreshToken(userId, hashedRefreshToken);
    
    const user = await this.userService.findOne(userId);
    // Güvenlik: Yanıttan hassas verileri çıkar
    const { hashedRefreshToken: _, ...userPayload } = user;

    return {
      user: userPayload,
      accessToken,
      refreshToken,
    };
  }

  async generateTokens(userId: string) {
    const payload: AuthJwtPayload = { sub: userId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, this.refreshTokenConfig),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(userId: string) {
    const { accessToken, refreshToken } = await this.generateTokens(userId);
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.userService.updateHashedRefreshToken(userId, hashedRefreshToken);
    return {
      id: userId,
      accessToken,
      refreshToken,
    };
  }

  async validateRefreshToken(userId: string, refreshToken: string) {
    const user = await this.userService.findOne(userId);
    if (!user || !user.hashedRefreshToken)
      throw new UnauthorizedException('Invalid Refresh Token');

    const refreshTokenMatches = await argon2.verify(
      user.hashedRefreshToken,
      refreshToken,
    );
    if (!refreshTokenMatches)
      throw new UnauthorizedException('Invalid Refresh Token');

    return { id: userId };
  }

  async signOut(userId: string) {
    await this.userService.updateHashedRefreshToken(userId, null);
  }

  async validateJwtUser(userId: string) {
    const user = await this.userService.findOne(userId);
    if (!user) throw new UnauthorizedException('User not found!');
    const currentUser: CurrentUser = { id: user.id, role: user.role };
    return currentUser;
  }

  async validateGoogleUser(googleUser: CreateUserDto) {
    const user = await this.userService.findByEmail(googleUser.email);
    if (user) return user;
    return await this.userService.create(googleUser);
  }

  async googleLogin(token: string) {
    try {
      console.log('--- BACKEND: Google Token Alındı ---');
      
      let googlePayload;
      
      try {
        // First, try to verify as ID token
        const ticket = await this.oauthClient.verifyIdToken({
          idToken: token,
          audience: this.googleConfig.clientId,
        });
        googlePayload = ticket.getPayload();
        console.log('--- BACKEND: Token verified as ID token ---');
      } catch (idTokenError) {
        console.log('--- BACKEND: Token is not an ID token, trying as access token ---');
        
        // If ID token verification fails, try as access token
        const userInfoResponse = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`
        );
        
        if (!userInfoResponse.ok) {
          throw new UnauthorizedException('Invalid Google token');
        }
        
        googlePayload = await userInfoResponse.json();
        console.log('--- BACKEND: User info fetched with access token ---');
      }

      if (!googlePayload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const { email, given_name, family_name, picture } = googlePayload;

      const userPayload: CreateUserDto = {
        email,
        firstName: given_name,
        lastName: family_name,
        avatarUrl: picture,
      };

      const user = await this.validateGoogleUser(userPayload);
      console.log('--- BACKEND: Kullanıcı Doğrulandı/Oluşturuldu, ID: ---', user.id);
      const tokens = await this.login(user.id);
      console.log('--- BACKEND: JWT Üretildi, Cevap Gönderiliyor ---');
      return tokens;
    } catch (error) {
      console.error('Google Login Error:', error);
      throw new UnauthorizedException('Failed to login with Google');
    }
  }
}
