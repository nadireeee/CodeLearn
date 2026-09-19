import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from 'src/entities/user.entity';

export type UserPreferenceDocument = UserPreference & Document;

@Schema({ collection: 'user_preferences', timestamps: true })
export class UserPreference {
  // PostgreSQL'deki User tablosuna referans.
  // Gerçek bir join değil, sadece mantıksal bir bağ.
  @Prop({ type: MongooseSchema.Types.String, ref: 'User', required: true, unique: true })
  userId: string;

  // Kullanıcının verdiği cevapları esnek bir şekilde saklamak için.
  // Örnek: { "experienceLevel": "beginner", "learningGoal": "game_dev" }
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  preferences: Record<string, any>;

  @Prop({ default: false })
  hasCompletedOnboarding: boolean;
}

export const UserPreferenceSchema = SchemaFactory.createForClass(UserPreference); 