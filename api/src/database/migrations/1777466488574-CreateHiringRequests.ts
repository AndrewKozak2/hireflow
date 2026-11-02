import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHiringRequests1777466488574 implements MigrationInterface {
    name = 'CreateHiringRequests1777466488574'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."hiring_requests_department_enum" AS ENUM('engineering', 'marketing', 'sales', 'hr', 'finance', 'product', 'design')`);
        await queryRunner.query(`CREATE TYPE "public"."hiring_requests_expertise_level_enum" AS ENUM('L1', 'L2', 'L3', 'L4', 'L5', 'L6')`);
        await queryRunner.query(`CREATE TYPE "public"."hiring_requests_english_level_enum" AS ENUM('A2', 'B1', 'B2', 'C1', 'C2')`);
        await queryRunner.query(`CREATE TYPE "public"."hiring_requests_location_enum" AS ENUM('remote', 'on_site', 'hybrid')`);
        await queryRunner.query(`CREATE TYPE "public"."hiring_requests_employment_type_enum" AS ENUM('full_time', 'part_time', 'contract', 'intern')`);
        await queryRunner.query(`CREATE TYPE "public"."hiring_requests_currency_enum" AS ENUM('USD', 'EUR', 'UAH', 'GBP')`);
        await queryRunner.query(`CREATE TYPE "public"."hiring_requests_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')`);
        await queryRunner.query(`CREATE TYPE "public"."hiring_requests_status_enum" AS ENUM('pending', 'approved', 'rejected', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "hiring_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "submitter_email" character varying NOT NULL, "job_title" character varying NOT NULL, "reason_for_opening" text NOT NULL, "department" "public"."hiring_requests_department_enum" NOT NULL, "headcount" integer NOT NULL, "expertise_level" "public"."hiring_requests_expertise_level_enum", "english_level" "public"."hiring_requests_english_level_enum", "required_experience_years" integer, "past_potential_positions" text, "key_requirements" text, "certifications_courses" text, "desired_personal_qualities" text, "unacceptable_personal_qualities" text, "role_purpose" text NOT NULL, "area_of_responsibility" text, "first_90_days_goals" text, "future_responsibilities" text, "reports_to_id" uuid, "direct_reports" text, "location" "public"."hiring_requests_location_enum", "employment_type" "public"."hiring_requests_employment_type_enum", "target_start_date" date, "salary_min" integer, "salary_max" integer, "currency" "public"."hiring_requests_currency_enum", "priority" "public"."hiring_requests_priority_enum", "attachments" text, "notes_for_recruiter" text, "status" "public"."hiring_requests_status_enum" NOT NULL DEFAULT 'pending', "created_by_id" uuid NOT NULL, "cancelled_by_id" uuid, "cancelled_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3b8c333952627d2725bb85feba1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'recruiter', 'hiring_manager')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."invitations_role_enum" RENAME TO "invitations_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."invitations_role_enum" AS ENUM('admin', 'recruiter', 'hiring_manager')`);
        await queryRunner.query(`ALTER TABLE "invitations" ALTER COLUMN "role" TYPE "public"."invitations_role_enum" USING "role"::"text"::"public"."invitations_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."invitations_role_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_3f918cef0053170f2a7fbc0be0" ON "job_approvals" ("job_id") `);
        await queryRunner.query(`ALTER TABLE "hiring_requests" ADD CONSTRAINT "FK_4baabce333c44655475c696e96d" FOREIGN KEY ("reports_to_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" ADD CONSTRAINT "FK_60dd31d46bb1346d5bc0b132a4e" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" ADD CONSTRAINT "FK_fece3fa7b71643fc25600c4b4d2" FOREIGN KEY ("cancelled_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`UPDATE "users" SET "status" = 'active' WHERE "role" = 'admin'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hiring_requests" DROP CONSTRAINT "FK_fece3fa7b71643fc25600c4b4d2"`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" DROP CONSTRAINT "FK_60dd31d46bb1346d5bc0b132a4e"`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" DROP CONSTRAINT "FK_4baabce333c44655475c696e96d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3f918cef0053170f2a7fbc0be0"`);
        await queryRunner.query(`CREATE TYPE "public"."invitations_role_enum_old" AS ENUM('admin', 'recruiter', 'manager')`);
        await queryRunner.query(`ALTER TABLE "invitations" ALTER COLUMN "role" TYPE "public"."invitations_role_enum_old" USING "role"::"text"::"public"."invitations_role_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."invitations_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."invitations_role_enum_old" RENAME TO "invitations_role_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum_old" AS ENUM('admin', 'recruiter', 'manager')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum_old" USING "role"::"text"::"public"."users_role_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum_old" RENAME TO "users_role_enum"`);
        await queryRunner.query(`DROP TABLE "hiring_requests"`);
        await queryRunner.query(`DROP TYPE "public"."hiring_requests_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."hiring_requests_priority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."hiring_requests_currency_enum"`);
        await queryRunner.query(`DROP TYPE "public"."hiring_requests_employment_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."hiring_requests_location_enum"`);
        await queryRunner.query(`DROP TYPE "public"."hiring_requests_english_level_enum"`);
        await queryRunner.query(`DROP TYPE "public"."hiring_requests_expertise_level_enum"`);
        await queryRunner.query(`DROP TYPE "public"."hiring_requests_department_enum"`);
    }

}
