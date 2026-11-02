import { MigrationInterface, QueryRunner } from "typeorm";

export class JobUpdating1782229074539 implements MigrationInterface {
    name = 'JobUpdating1782229074539'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "employment_type"`);
        await queryRunner.query(`CREATE TYPE "public"."job_listings_employmenttype_enum" AS ENUM('full_time', 'part_time', 'contract', 'intern')`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "employmentType" "public"."job_listings_employmenttype_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."job_listings_department_enum" AS ENUM('engineering', 'marketing', 'sales', 'hr', 'finance', 'product', 'design')`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "department" "public"."job_listings_department_enum"`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "headcount" integer`);
        await queryRunner.query(`CREATE TYPE "public"."job_listings_expertise_level_enum" AS ENUM('L1', 'L2', 'L3', 'L4', 'L5', 'L6')`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "expertise_level" "public"."job_listings_expertise_level_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."job_listings_english_level_enum" AS ENUM('A2', 'B1', 'B2', 'C1', 'C2')`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "english_level" "public"."job_listings_english_level_enum"`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "salary_min" integer`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "salary_max" integer`);
        await queryRunner.query(`CREATE TYPE "public"."job_listings_currency_enum" AS ENUM('USD', 'EUR', 'UAH', 'GBP')`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "currency" "public"."job_listings_currency_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."job_listings_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "priority" "public"."job_listings_priority_enum"`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "hiring_request_id" character varying`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "reason_for_opening" text`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "role_purpose" text`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "first_90_days_goals" text`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "location"`);
        await queryRunner.query(`CREATE TYPE "public"."job_listings_location_enum" AS ENUM('remote', 'on_site', 'hybrid')`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "location" "public"."job_listings_location_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "location"`);
        await queryRunner.query(`DROP TYPE "public"."job_listings_location_enum"`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "location" character varying`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "first_90_days_goals"`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "role_purpose"`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "reason_for_opening"`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "hiring_request_id"`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "priority"`);
        await queryRunner.query(`DROP TYPE "public"."job_listings_priority_enum"`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "currency"`);
        await queryRunner.query(`DROP TYPE "public"."job_listings_currency_enum"`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "salary_max"`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "salary_min"`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "english_level"`);
        await queryRunner.query(`DROP TYPE "public"."job_listings_english_level_enum"`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "expertise_level"`);
        await queryRunner.query(`DROP TYPE "public"."job_listings_expertise_level_enum"`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "headcount"`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "department"`);
        await queryRunner.query(`DROP TYPE "public"."job_listings_department_enum"`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "employmentType"`);
        await queryRunner.query(`DROP TYPE "public"."job_listings_employmenttype_enum"`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "employment_type" character varying`);
        }

}
