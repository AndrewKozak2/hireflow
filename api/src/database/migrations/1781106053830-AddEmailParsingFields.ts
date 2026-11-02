import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailParsingFields1781106053830 implements MigrationInterface {
    name = 'AddEmailParsingFields1781106053830'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "candidates" ADD "isAutoCreated" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE TYPE "public"."email_ingestion_event_status_enum" AS ENUM('received', 'processing', 'candidate_resolved', 'processed', 'not_application', 'failed')`);
        await queryRunner.query(`ALTER TABLE "email_ingestion_event" ADD "status" "public"."email_ingestion_event_status_enum" NOT NULL DEFAULT 'received'`);
        await queryRunner.query(`ALTER TABLE "email_ingestion_event" ADD "candidateId" uuid`);
        await queryRunner.query(`ALTER TABLE "email_ingestion_event" ADD "classificationResult" jsonb`);
        await queryRunner.query(`ALTER TABLE "email_ingestion_event" ADD "errorMessage" text`);
        await queryRunner.query(`ALTER TABLE "email_ingestion_event" ADD CONSTRAINT "FK_f5ea1ff3a96e23a0e122a3a41e7" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "email_ingestion_event" DROP CONSTRAINT "FK_f5ea1ff3a96e23a0e122a3a41e7"`);
        await queryRunner.query(`ALTER TABLE "email_ingestion_event" DROP COLUMN "errorMessage"`);
        await queryRunner.query(`ALTER TABLE "email_ingestion_event" DROP COLUMN "classificationResult"`);
        await queryRunner.query(`ALTER TABLE "email_ingestion_event" DROP COLUMN "candidateId"`);
        await queryRunner.query(`ALTER TABLE "email_ingestion_event" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."email_ingestion_event_status_enum"`);
        await queryRunner.query(`ALTER TABLE "candidates" DROP COLUMN "isAutoCreated"`);
    }

}
