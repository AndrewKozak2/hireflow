import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRejectedJobStatus1779260000000 implements MigrationInterface {
    name = 'AddRejectedJobStatus1779260000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."job_listings_status_enum" ADD VALUE IF NOT EXISTS 'rejected'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_listings" ALTER COLUMN "status" TYPE varchar USING status::text`);
        await queryRunner.query(`DROP TYPE "public"."job_listings_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."job_listings_status_enum" AS ENUM ('draft', 'pending_approval', 'active', 'paused', 'closed')`);
        await queryRunner.query(`ALTER TABLE "job_listings" ALTER COLUMN "status" TYPE "public"."job_listings_status_enum" USING status::"public"."job_listings_status_enum"`);
    }
}
