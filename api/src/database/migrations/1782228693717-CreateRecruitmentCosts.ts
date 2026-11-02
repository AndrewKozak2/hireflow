import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRecruitmentCosts1782228693717 implements MigrationInterface {
    name = 'CreateRecruitmentCosts1782228693717'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."recruitment_costs_category_enum" AS ENUM('JOB_POSTING', 'SOURCE_SUCCESS_FEE', 'INTERVIEW_PAYMENT', 'RECRUITER_COMMISSION', 'REFERRAL_BONUS', 'OTHER')`);
        await queryRunner.query(`CREATE TYPE "public"."recruitment_costs_currency_enum" AS ENUM('USD')`);
        await queryRunner.query(`CREATE TABLE "recruitment_costs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "job_id" uuid NOT NULL, "application_id" uuid, "category" "public"."recruitment_costs_category_enum" NOT NULL, "source" character varying, "title" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "currency" "public"."recruitment_costs_currency_enum" NOT NULL DEFAULT 'USD', "incurred_at" TIMESTAMP WITH TIME ZONE NOT NULL, "description" text, "created_by" uuid NOT NULL, "automation_key" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_1208f8fd8e876d8e46cf264cbc3" UNIQUE ("automation_key"), CONSTRAINT "PK_e0864f25af66e7981d419cb9ea1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "applications" ADD "actualMonthlySalary" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "applications" ADD "salaryCurrency" character varying`);
        await queryRunner.query(`ALTER TABLE "applications" ADD "recruiterCommissionPercent" numeric(5,2)`);
        await queryRunner.query(`ALTER TABLE "recruitment_costs" ADD CONSTRAINT "FK_04721e78dea7f1d295e4d2c7d47" FOREIGN KEY ("job_id") REFERENCES "job_listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recruitment_costs" ADD CONSTRAINT "FK_86bb6bdf789b31fb4ae3709c64c" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recruitment_costs" ADD CONSTRAINT "FK_e780e7a708924a11587af6f722c" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recruitment_costs" DROP CONSTRAINT "FK_e780e7a708924a11587af6f722c"`);
        await queryRunner.query(`ALTER TABLE "recruitment_costs" DROP CONSTRAINT "FK_86bb6bdf789b31fb4ae3709c64c"`);
        await queryRunner.query(`ALTER TABLE "recruitment_costs" DROP CONSTRAINT "FK_04721e78dea7f1d295e4d2c7d47"`);
        await queryRunner.query(`ALTER TABLE "applications" DROP COLUMN "recruiterCommissionPercent"`);
        await queryRunner.query(`ALTER TABLE "applications" DROP COLUMN "salaryCurrency"`);
        await queryRunner.query(`ALTER TABLE "applications" DROP COLUMN "actualMonthlySalary"`);
        await queryRunner.query(`DROP TABLE "recruitment_costs"`);
        await queryRunner.query(`DROP TYPE "public"."recruitment_costs_currency_enum"`);
        await queryRunner.query(`DROP TYPE "public"."recruitment_costs_category_enum"`);
    }

}
