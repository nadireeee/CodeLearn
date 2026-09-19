import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBinaryImageSupport1751563597951 implements MigrationInterface {
    name = 'AddBinaryImageSupport1751563597951'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."answers_contenttype_enum" AS ENUM('text', 'html', 'markdown')`);
        await queryRunner.query(`ALTER TABLE "answers" ADD "contentType" "public"."answers_contenttype_enum" NOT NULL DEFAULT 'html'`);
        await queryRunner.query(`ALTER TABLE "answers" ADD "plainTextContent" text`);
        await queryRunner.query(`ALTER TABLE "answers" ADD "images" json`);
        await queryRunner.query(`ALTER TABLE "answers" ADD "codeBlocks" text`);
        await queryRunner.query(`ALTER TABLE "answers" ADD "metadata" json`);
        await queryRunner.query(`CREATE TYPE "public"."questions_contenttype_enum" AS ENUM('text', 'html', 'markdown')`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "contentType" "public"."questions_contenttype_enum" NOT NULL DEFAULT 'html'`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "plainTextContent" text`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "codeBlocks" text`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "metadata" json`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "images"`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "images" json`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "images"`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "images" text`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "codeBlocks"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "plainTextContent"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "contentType"`);
        await queryRunner.query(`DROP TYPE "public"."questions_contenttype_enum"`);
        await queryRunner.query(`ALTER TABLE "answers" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "answers" DROP COLUMN "codeBlocks"`);
        await queryRunner.query(`ALTER TABLE "answers" DROP COLUMN "images"`);
        await queryRunner.query(`ALTER TABLE "answers" DROP COLUMN "plainTextContent"`);
        await queryRunner.query(`ALTER TABLE "answers" DROP COLUMN "contentType"`);
        await queryRunner.query(`DROP TYPE "public"."answers_contenttype_enum"`);
    }

}
