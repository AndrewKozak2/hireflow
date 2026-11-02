import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserStatus1776900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'pending', 'deactivated')`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" ADD "status" "public"."users_status_enum" NOT NULL DEFAULT 'pending'`,
    );

    await queryRunner.query(
      `UPDATE "users" SET "status" = 'active' WHERE "is_active" = true`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "status" = 'deactivated' WHERE "is_active" = false`,
    );

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_active"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "is_active" = true WHERE "status" = 'active' OR "status" = 'pending'`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
  }
}
