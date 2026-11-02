import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTimestampsToTimestampstz1779279657537 implements MigrationInterface {
    name = 'UpdateTimestampsToTimestampstz1779279657537'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_approvals" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "job_approvals" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "job_approvals" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "job_approvals" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" DROP COLUMN "cancelled_at"`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" ADD "cancelled_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "candidate_cvs" DROP COLUMN "uploadedAt"`);
        await queryRunner.query(`ALTER TABLE "candidate_cvs" ADD "uploadedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "candidate_cvs" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "candidate_cvs" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "candidate_cvs" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "candidate_cvs" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "candidates" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "candidates" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "candidates" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "candidates" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "expires_at"`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "accepted_at"`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD "accepted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" DROP COLUMN "expires_at"`);
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" ADD "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "application_comment" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "application_comment" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "application_event" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "application_event" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "applications" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "applications" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "applications" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "applications" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "score_cards" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "score_cards" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "score_cards" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "score_cards" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "applications" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "applications" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "applications" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "applications" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "application_event" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "application_event" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "application_comment" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "application_comment" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" DROP COLUMN "expires_at"`);
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" ADD "expires_at" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "accepted_at"`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD "accepted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "expires_at"`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD "expires_at" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "candidates" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "candidates" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "candidates" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "candidates" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "candidate_cvs" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "candidate_cvs" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "candidate_cvs" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "candidate_cvs" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "candidate_cvs" DROP COLUMN "uploadedAt"`);
        await queryRunner.query(`ALTER TABLE "candidate_cvs" ADD "uploadedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" DROP COLUMN "cancelled_at"`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" ADD "cancelled_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "job_approvals" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "job_approvals" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "job_approvals" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "job_approvals" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
    }

}
