import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private UserRepo: Repository<User>) {}

  async updateHashedRefreshToken(userId: string, hashedRefreshToken: string) {
    return await this.UserRepo.update({ id: userId }, { hashedRefreshToken });
  }

  async create(createUserDto: CreateUserDto) {
    // Güvenlik: Password'ü log'da gösterme!
    const { password, ...safeUserData } = createUserDto;
    console.log('🔐 Creating user:', { ...safeUserData, password: '[HIDDEN]' });
    
    const user = await this.UserRepo.create(createUserDto);
    const savedUser = await this.UserRepo.save(user);
    
    // Response'da password'ü çıkar
    const { password: _, ...userResponse } = savedUser;
    console.log('✅ User created successfully:', { id: userResponse.id, email: userResponse.email });
    
    return userResponse;
  }

  async findByEmail(email: string) {
    const user = await this.UserRepo.findOne({
      where: { email },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'avatarUrl',
        'role',
        'hashedRefreshToken',
        'password', // Sadece auth için gerekli
      ],
    });
    return user;
  }

  findAll() {
    return `This action returns all user`;
  }

  async findOne(id: string) {
    return this.UserRepo.findOne({
      where: { id },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'avatarUrl',
        'hashedRefreshToken',
        'role',
      ],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const result = await this.UserRepo.update(id, updateUserDto);
    
    if (result.affected === 0) {
      throw new Error('User not found');
    }
    
    // Güncellenmiş kullanıcıyı döndür
    return await this.findOne(id);
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }

  // 🔥 YENİ: User istatistiklerini güncelle
  async updateUserStats(userId: string, stats: { 
    totalSolvedQuestions?: number;
    totalCreatedProjects?: number;
  }): Promise<void> {
    await this.UserRepo.update({ id: userId }, stats);
  }

  // 🔥 YENİ: User istatistiklerini al
  async getUserStats(userId: string): Promise<any> {
    const user = await this.UserRepo.findOne({
      where: { id: userId },
      select: ['totalSolvedQuestions', 'totalCreatedProjects']
    });
    
    return {
      totalSolvedQuestions: user?.totalSolvedQuestions || 0,
      totalCreatedProjects: user?.totalCreatedProjects || 0,
    };
  }
}
