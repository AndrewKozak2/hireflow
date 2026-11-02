import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEmailIngestTable1779259210701 implements MigrationInterface {
    name = 'CreateEmailIngestTable1779259210701'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "email_ingestion_event" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "gmailMessageId" character varying NOT NULL, "sender" character varying NOT NULL, "threadId" character varying, "forwardedBy" character varying, "applicationId" uuid, "receivedAt" TIMESTAMP WITH TIME ZONE, "payload" jsonb NOT NULL, "attachmentManifest" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_670002ba79f0bb1ffad4f826e36" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_24d8b00ca5da0dd535c8e29ff2" ON "email_ingestion_event" ("gmailMessageId") `);
        await queryRunner.query(`CREATE INDEX "IDX_64c0054a396c027c25d7ef3950" ON "email_ingestion_event" ("sender") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_64c0054a396c027c25d7ef3950"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_24d8b00ca5da0dd535c8e29ff2"`);
        await queryRunner.query(`DROP TABLE "email_ingestion_event"`);
    }

}
