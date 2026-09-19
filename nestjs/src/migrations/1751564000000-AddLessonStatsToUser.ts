import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLessonStatsToUser1751564000000 implements MigrationInterface {
  name = 'AddLessonStatsToUser1751564000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" 
      ADD COLUMN "totalCompletedLessons" integer NOT NULL DEFAULT 0
    `);
    
    await queryRunner.query(`
      ALTER TABLE "user" 
      ADD COLUMN "totalPassedTests" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" 
      DROP COLUMN "totalPassedTests"
    `);
    
    await queryRunner.query(`
      ALTER TABLE "user" 
      DROP COLUMN "totalCompletedLessons"
    `);
  }
} 