import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateApplicationsModule1777981085487 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {


        await queryRunner.query(`
            CREATE TYPE "public"."application_stage_enum" AS ENUM (
                'new',
                'screening',
                'pre_interview',
                'technical_interview',
                'offer',
                'hired',
                'rejected'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."application_source_enum" AS ENUM (
                'djinni',
                'dou',
                'linkedin',
                'manual',
                'referral',
                'talent_pool'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."application_ai_recommendation_enum" AS ENUM (
                'proceed',
                'review',
                'reject'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."application_rejection_reason_enum" AS ENUM (
                'skills_mismatch',
                'overqualified',
                'not_culture_fit',
                'salary_expectations',
                'no_response',
                'position_closed',
                'other'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."application_event_type_enum" AS ENUM (
                'stage_changed',
                'email_sent',
                'comment_added',
                'ai_screening_completed',
                'cv_uploaded',
                'score_card_submitted',
                'application_created'
            )
        `);


        await queryRunner.query(`
            CREATE TABLE "application" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "candidateId" uuid NOT NULL,
                "jobId" uuid NOT NULL,
                "stage" "public"."application_stage_enum" NOT NULL DEFAULT 'new',
                "source" "public"."application_source_enum" NOT NULL,
                "aiScore" integer,
                "aiSummary" text,
                "aiRecommendation" "public"."application_ai_recommendation_enum",
                "rejectionReason" "public"."application_rejection_reason_enum",
                "rejectionComment" text,
                "recruiterId" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_application_candidate_job" UNIQUE ("candidateId", "jobId")
            )
        `);


        await queryRunner.query(`
            CREATE TABLE "application_comment" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "applicationId" uuid NOT NULL,
                "authorId" uuid NOT NULL,
                "content" text NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);


        await queryRunner.query(`
            CREATE TABLE "application_event" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "applicationId" uuid NOT NULL,
                "actorId" uuid,
                "type" "public"."application_event_type_enum" NOT NULL,
                "payload" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);


        await queryRunner.query(`CREATE INDEX "IDX_application_candidate" ON "application" ("candidateId")`);
        await queryRunner.query(`CREATE INDEX "IDX_application_job" ON "application" ("jobId")`);
        await queryRunner.query(`CREATE INDEX "IDX_application_stage" ON "application" ("stage")`);
        await queryRunner.query(`CREATE INDEX "IDX_application_source" ON "application" ("source")`);

        await queryRunner.query(`CREATE INDEX "IDX_application_comment_application" ON "application_comment" ("applicationId")`);
        await queryRunner.query(`CREATE INDEX "IDX_application_event_application" ON "application_event" ("applicationId")`);


        await queryRunner.query(`
            ALTER TABLE "application"
            ADD CONSTRAINT "FK_application_candidate"
            FOREIGN KEY ("candidateId") REFERENCES "candidates"("id")
        `);

        await queryRunner.query(`
            ALTER TABLE "application"
            ADD CONSTRAINT "FK_application_job"
            FOREIGN KEY ("jobId") REFERENCES "job_listings"("id")
        `);

        await queryRunner.query(`
            ALTER TABLE "application"
            ADD CONSTRAINT "FK_application_recruiter"
            FOREIGN KEY ("recruiterId") REFERENCES "users"("id")
        `);

        await queryRunner.query(`
            ALTER TABLE "application_comment"
            ADD CONSTRAINT "FK_comment_application"
            FOREIGN KEY ("applicationId") REFERENCES "application"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "application_comment"
            ADD CONSTRAINT "FK_comment_author"
            FOREIGN KEY ("authorId") REFERENCES "users"("id")
        `);

        await queryRunner.query(`
            ALTER TABLE "application_event"
            ADD CONSTRAINT "FK_event_application"
            FOREIGN KEY ("applicationId") REFERENCES "application"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "application_event"
            ADD CONSTRAINT "FK_event_actor"
            FOREIGN KEY ("actorId") REFERENCES "users"("id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`ALTER TABLE "application_event" DROP CONSTRAINT "FK_event_actor"`);
        await queryRunner.query(`ALTER TABLE "application_event" DROP CONSTRAINT "FK_event_application"`);

        await queryRunner.query(`ALTER TABLE "application_comment" DROP CONSTRAINT "FK_comment_author"`);
        await queryRunner.query(`ALTER TABLE "application_comment" DROP CONSTRAINT "FK_comment_application"`);

        await queryRunner.query(`ALTER TABLE "application" DROP CONSTRAINT "FK_application_recruiter"`);
        await queryRunner.query(`ALTER TABLE "application" DROP CONSTRAINT "FK_application_job"`);
        await queryRunner.query(`ALTER TABLE "application" DROP CONSTRAINT "FK_application_candidate"`);

        await queryRunner.query(`DROP TABLE "application_event"`);
        await queryRunner.query(`DROP TABLE "application_comment"`);
        await queryRunner.query(`DROP TABLE "application"`);

        await queryRunner.query(`DROP TYPE "public"."application_event_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."application_rejection_reason_enum"`);
        await queryRunner.query(`DROP TYPE "public"."application_ai_recommendation_enum"`);
        await queryRunner.query(`DROP TYPE "public"."application_source_enum"`);
        await queryRunner.query(`DROP TYPE "public"."application_stage_enum"`);
    }
}
