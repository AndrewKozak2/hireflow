import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeRequiredFieldsNullableForDrafts1783000000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hiring_requests" ALTER COLUMN "job_title" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hiring_requests" ALTER COLUMN "reason_for_opening" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hiring_requests" ALTER COLUMN "role_purpose" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "hiring_requests" SET "job_title" = '' WHERE "job_title" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hiring_requests" ALTER COLUMN "job_title" SET NOT NULL`,
    );
    await queryRunner.query(
      `UPDATE "hiring_requests" SET "reason_for_opening" = '' WHERE "reason_for_opening" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hiring_requests" ALTER COLUMN "reason_for_opening" SET NOT NULL`,
    );
    await queryRunner.query(
      `UPDATE "hiring_requests" SET "role_purpose" = '' WHERE "role_purpose" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hiring_requests" ALTER COLUMN "role_purpose" SET NOT NULL`,
    );
  }
}
