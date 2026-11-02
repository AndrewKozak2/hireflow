import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotificationsTable1780998554799 implements MigrationInterface {
    name = 'CreateNotificationsTable1780998554799'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR')`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_email_status_enum" AS ENUM('NONE', 'PENDING', 'SENT', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "recipient_email" character varying, "title" character varying NOT NULL, "message" text NOT NULL, "type" "public"."notifications_type_enum" NOT NULL DEFAULT 'INFO', "metadata" jsonb, "is_read" boolean NOT NULL DEFAULT false, "email_status" "public"."notifications_email_status_enum" NOT NULL DEFAULT 'NONE', "email_error" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_notifications_user_id_is_read" ON "notifications" ("user_id", "is_read") `);
        await queryRunner.query(`CREATE INDEX "idx_notifications_user_id_created_at" ON "notifications" ("user_id", "created_at") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "notifications_cleared_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "notifications_cleared_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_notifications_user_id_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_notifications_user_id_is_read"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_email_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    }

}
