import { MigrationInterface, QueryRunner } from "typeorm";

export class DropExistingHiringRequestId1782228800000
  implements MigrationInterface
{
  name = "DropExistingHiringRequestId1782228800000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "job_listings" DROP COLUMN IF EXISTS "hiring_request_id"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "job_listings" ADD COLUMN IF NOT EXISTS "hiring_request_id" character varying`,
    );
  }
}
