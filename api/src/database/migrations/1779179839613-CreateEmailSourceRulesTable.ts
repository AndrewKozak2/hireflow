import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEmailSourceRulesTable1779179839613 implements MigrationInterface {
    name = 'CreateEmailSourceRulesTable1779179839613'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "email_source_rules" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "sender_pattern" varchar NOT NULL, 
                "source_label" varchar NOT NULL, 
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_email_source_rules_sender_pattern" UNIQUE ("sender_pattern"),
                CONSTRAINT "PK_email_source_rules_id" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "email_source_rules"`);
    }

}
