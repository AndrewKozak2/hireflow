import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHiringRequestReviews1780432020849 implements MigrationInterface {
    name = 'CreateHiringRequestReviews1780432020849'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."hiring_request_reviews_action_enum" AS ENUM('rejected', 'resubmitted')`);
        await queryRunner.query(`CREATE TABLE "hiring_request_reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "hiring_request_id" uuid NOT NULL, "round" integer NOT NULL, "reviewer_id" uuid NOT NULL, "action" "public"."hiring_request_reviews_action_enum" NOT NULL, "reason" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0571769291508d7f385a5916c8c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fd8cb1dc5e6f7a4bc9ec6a6777" ON "hiring_request_reviews" ("hiring_request_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_545f1e3b5940d5006b2e4b18a9" ON "hiring_request_reviews" ("reviewer_id") `);
        await queryRunner.query(`ALTER TABLE "hiring_requests" ADD "assigned_recruiter_id" uuid`);
        await queryRunner.query(`ALTER TABLE "hiring_request_reviews" ADD CONSTRAINT "FK_fd8cb1dc5e6f7a4bc9ec6a67775" FOREIGN KEY ("hiring_request_id") REFERENCES "hiring_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hiring_request_reviews" ADD CONSTRAINT "FK_545f1e3b5940d5006b2e4b18a97" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" ADD CONSTRAINT "FK_814fce375e7cc10010ef18e9403" FOREIGN KEY ("assigned_recruiter_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hiring_requests" DROP CONSTRAINT "FK_814fce375e7cc10010ef18e9403"`);
        await queryRunner.query(`ALTER TABLE "hiring_request_reviews" DROP CONSTRAINT "FK_545f1e3b5940d5006b2e4b18a97"`);
        await queryRunner.query(`ALTER TABLE "hiring_request_reviews" DROP CONSTRAINT "FK_fd8cb1dc5e6f7a4bc9ec6a67775"`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" DROP COLUMN "assigned_recruiter_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_545f1e3b5940d5006b2e4b18a9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fd8cb1dc5e6f7a4bc9ec6a6777"`);
        await queryRunner.query(`DROP TABLE "hiring_request_reviews"`);
        await queryRunner.query(`DROP TYPE "public"."hiring_request_reviews_action_enum"`);
    }

}
