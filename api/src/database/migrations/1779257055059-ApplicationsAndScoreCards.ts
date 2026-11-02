import { MigrationInterface, QueryRunner } from "typeorm";

export class ApplicationsAndScoreCards1779257055059 implements MigrationInterface {
    name = 'ApplicationsAndScoreCards1779257055059'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application_comment" DROP CONSTRAINT "FK_comment_application"`);
        await queryRunner.query(`ALTER TABLE "application_comment" DROP CONSTRAINT "FK_comment_author"`);
        await queryRunner.query(`ALTER TABLE "application_event" DROP CONSTRAINT "FK_event_application"`);
        await queryRunner.query(`ALTER TABLE "application_event" DROP CONSTRAINT "FK_event_actor"`);
        await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "FK_application_candidate"`);
        await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "FK_application_job"`);
        await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "FK_application_recruiter"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_application_comment_application"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_application_event_application"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_application_candidate"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_application_job"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_application_stage"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_application_source"`);
        await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "UQ_application_candidate_job"`);
        await queryRunner.query(`CREATE TYPE "public"."score_cards_recommendation_enum" AS ENUM('proceed', 'maybe', 'reject')`);
        await queryRunner.query(`CREATE TABLE "score_cards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "applicationId" uuid NOT NULL, "recommendation" "public"."score_cards_recommendation_enum" NOT NULL, "comment" text, "interviewerId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2fbd3fd798e2a51d1b392a17f9f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status"`);
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'pending', 'deactivated')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "status" "public"."users_status_enum" NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TYPE "public"."application_source_enum" RENAME TO "application_source_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."applications_source_enum" AS ENUM('djinni', 'dou', 'linkedin', 'manual', 'referral', 'talent_pool')`);
        await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "source" TYPE "public"."applications_source_enum" USING "source"::"text"::"public"."applications_source_enum"`);
        await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "source" SET DEFAULT 'manual'`);
        await queryRunner.query(`DROP TYPE "public"."application_source_enum_old"`);
        await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "source" SET DEFAULT 'manual'`);
        await queryRunner.query(`ALTER TYPE "public"."application_stage_enum" RENAME TO "application_stage_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."applications_stage_enum" AS ENUM('new', 'screening', 'pre_interview', 'technical_interview', 'offer', 'hired', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "stage" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "stage" TYPE "public"."applications_stage_enum" USING "stage"::"text"::"public"."applications_stage_enum"`);
        await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "stage" SET DEFAULT 'new'`);
        await queryRunner.query(`DROP TYPE "public"."application_stage_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."application_ai_recommendation_enum" RENAME TO "application_ai_recommendation_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."applications_airecommendation_enum" AS ENUM('proceed', 'review', 'reject')`);
        await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "aiRecommendation" TYPE "public"."applications_airecommendation_enum" USING "aiRecommendation"::"text"::"public"."applications_airecommendation_enum"`);
        await queryRunner.query(`DROP TYPE "public"."application_ai_recommendation_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."application_rejection_reason_enum" RENAME TO "application_rejection_reason_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."applications_rejectionreason_enum" AS ENUM('skills_mismatch', 'overqualified', 'not_culture_fit', 'salary_expectations', 'no_response', 'position_closed', 'other')`);
        await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "rejectionReason" TYPE "public"."applications_rejectionreason_enum" USING "rejectionReason"::"text"::"public"."applications_rejectionreason_enum"`);
        await queryRunner.query(`DROP TYPE "public"."application_rejection_reason_enum_old"`);
        await queryRunner.query(`ALTER TABLE "applications" ADD CONSTRAINT "UQ_b005ac451f3e0550c2c8cb5bbaa" UNIQUE ("candidateId", "jobId")`);
        await queryRunner.query(`ALTER TABLE "application_comment" ADD CONSTRAINT "FK_4e28b0d5fffd33db6cf99038b3d" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_comment" ADD CONSTRAINT "FK_8dd529b6f79521c599fbcd180fa" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_event" ADD CONSTRAINT "FK_d42dbde7df34df036ac0dc4b121" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_event" ADD CONSTRAINT "FK_984f42b76178c51efe984258bb2" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applications" ADD CONSTRAINT "FK_a34254e3f2b3d20f07f8dbd6322" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applications" ADD CONSTRAINT "FK_f6ebb8bc5061068e4dd97df3c77" FOREIGN KEY ("jobId") REFERENCES "job_listings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applications" ADD CONSTRAINT "FK_fac78a178ef56efd0586fa1dc5d" FOREIGN KEY ("recruiterId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "score_cards" ADD CONSTRAINT "FK_aa583dfc13280a7d774c3c6bf83" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "score_cards" ADD CONSTRAINT "FK_0808166c6eade51253454a68022" FOREIGN KEY ("interviewerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "score_cards" DROP CONSTRAINT "FK_0808166c6eade51253454a68022"`);
        await queryRunner.query(`ALTER TABLE "score_cards" DROP CONSTRAINT "FK_aa583dfc13280a7d774c3c6bf83"`);
        await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "FK_fac78a178ef56efd0586fa1dc5d"`);
        await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "FK_f6ebb8bc5061068e4dd97df3c77"`);
        await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "FK_a34254e3f2b3d20f07f8dbd6322"`);
        await queryRunner.query(`ALTER TABLE "application_event" DROP CONSTRAINT "FK_984f42b76178c51efe984258bb2"`);
        await queryRunner.query(`ALTER TABLE "application_event" DROP CONSTRAINT "FK_d42dbde7df34df036ac0dc4b121"`);
        await queryRunner.query(`ALTER TABLE "application_comment" DROP CONSTRAINT "FK_8dd529b6f79521c599fbcd180fa"`);
        await queryRunner.query(`ALTER TABLE "application_comment" DROP CONSTRAINT "FK_4e28b0d5fffd33db6cf99038b3d"`);
        await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "UQ_b005ac451f3e0550c2c8cb5bbaa"`);
        await queryRunner.query(`CREATE TYPE "public"."application_rejection_reason_enum_old" AS ENUM('skills_mismatch', 'overqualified', 'not_culture_fit', 'salary_expectations', 'no_response', 'position_closed', 'other')`);
        await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "rejectionReason" TYPE "public"."application_rejection_reason_enum_old" USING "rejectionReason"::"text"::"public"."application_rejection_reason_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."applications_rejectionreason_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."application_rejection_reason_enum_old" RENAME TO "application_rejection_reason_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."application_ai_recommendation_enum_old" AS ENUM('proceed', 'review', 'reject')`);
        await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "aiRecommendation" TYPE "public"."application_ai_recommendation_enum_old" USING "aiRecommendation"::"text"::"public"."application_ai_recommendation_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."applications_airecommendation_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."application_ai_recommendation_enum_old" RENAME TO "application_ai_recommendation_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."application_stage_enum_old" AS ENUM('new', 'screening', 'pre_interview', 'technical_interview', 'offer', 'hired', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "stage" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "stage" TYPE "public"."application_stage_enum_old" USING "stage"::"text"::"public"."application_stage_enum_old"`);
        await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "stage" SET DEFAULT 'new'`);
        await queryRunner.query(`DROP TYPE "public"."applications_stage_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."application_stage_enum_old" RENAME TO "application_stage_enum"`);
        await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "source" DROP DEFAULT`);
        await queryRunner.query(`CREATE TYPE "public"."application_source_enum_old" AS ENUM('djinni', 'dou', 'linkedin', 'manual', 'referral', 'talent_pool')`);
        await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "source" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "source" TYPE "public"."application_source_enum_old" USING "source"::"text"::"public"."application_source_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."applications_source_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."application_source_enum_old" RENAME TO "application_source_enum"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "status" character varying NOT NULL DEFAULT true`);
        await queryRunner.query(`DROP TABLE "score_cards"`);
        await queryRunner.query(`DROP TYPE "public"."score_cards_recommendation_enum"`);
        await queryRunner.query(`ALTER TABLE "applications" ADD CONSTRAINT "UQ_application_candidate_job" UNIQUE ("candidateId", "jobId")`);
        await queryRunner.query(`CREATE INDEX "IDX_application_source" ON "applications" ("source") `);
        await queryRunner.query(`CREATE INDEX "IDX_application_stage" ON "applications" ("stage") `);
        await queryRunner.query(`CREATE INDEX "IDX_application_job" ON "applications" ("jobId") `);
        await queryRunner.query(`CREATE INDEX "IDX_application_candidate" ON "applications" ("candidateId") `);
        await queryRunner.query(`CREATE INDEX "IDX_application_event_application" ON "application_event" ("applicationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_application_comment_application" ON "application_comment" ("applicationId") `);
        await queryRunner.query(`ALTER TABLE "applications" ADD CONSTRAINT "FK_application_recruiter" FOREIGN KEY ("recruiterId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applications" ADD CONSTRAINT "FK_application_job" FOREIGN KEY ("jobId") REFERENCES "job_listings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applications" ADD CONSTRAINT "FK_application_candidate" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_event" ADD CONSTRAINT "FK_event_actor" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_event" ADD CONSTRAINT "FK_event_application" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_comment" ADD CONSTRAINT "FK_comment_author" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_comment" ADD CONSTRAINT "FK_comment_application" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
