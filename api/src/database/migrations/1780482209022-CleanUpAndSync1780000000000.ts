import { MigrationInterface, QueryRunner } from "typeorm";

export class CleanUpAndSync17800000000001780482209022 implements MigrationInterface {
    name = 'CleanUpAndSync17800000000001780482209022'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."job_listings_status_enum" RENAME TO "job_listings_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."job_listings_status_enum" AS ENUM('draft', 'pending_approval', 'active', 'paused', 'closed', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "job_listings" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "job_listings" ALTER COLUMN "status" TYPE "public"."job_listings_status_enum" USING "status"::"text"::"public"."job_listings_status_enum"`);
        await queryRunner.query(`ALTER TABLE "job_listings" ALTER COLUMN "status" SET DEFAULT 'draft'`);
        await queryRunner.query(`DROP TYPE "public"."job_listings_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."job_listings_status_enum_old" AS ENUM('draft', 'pending_approval', 'active', 'paused', 'closed')`);
        await queryRunner.query(`ALTER TABLE "job_listings" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "job_listings" ALTER COLUMN "status" TYPE "public"."job_listings_status_enum_old" USING "status"::"text"::"public"."job_listings_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "job_listings" ALTER COLUMN "status" SET DEFAULT 'draft'`);
        await queryRunner.query(`DROP TYPE "public"."job_listings_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."job_listings_status_enum_old" RENAME TO "job_listings_status_enum"`);
    }

}
