import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeDepartmentNullableForDrafts1783000000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hiring_requests" ALTER COLUMN "department" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Nullify any drafts before restoring the constraint
    await queryRunner.query(
      `UPDATE "hiring_requests" SET "department" = 'engineering' WHERE "department" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hiring_requests" ALTER COLUMN "department" SET NOT NULL`,
    );
  }
}
