import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDraftStatusToHiringRequests1783000000000
  implements MigrationInterface
{
  name = "AddDraftStatusToHiringRequests1783000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."hiring_requests_status_enum" ADD VALUE IF NOT EXISTS 'draft' BEFORE 'pending'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "hiring_requests" WHERE status = 'draft'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."hiring_requests_status_enum" RENAME TO "hiring_requests_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."hiring_requests_status_enum" AS ENUM('pending','in_review','approved','rejected','cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hiring_requests" ALTER COLUMN "status" TYPE "public"."hiring_requests_status_enum" USING "status"::"text"::"public"."hiring_requests_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."hiring_requests_status_enum_old"`,
    );
  }
}
