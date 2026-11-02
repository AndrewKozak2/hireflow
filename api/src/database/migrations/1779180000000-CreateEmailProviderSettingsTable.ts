import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEmailProviderSettingsTable1779180000000
  implements MigrationInterface
{
  name = "CreateEmailProviderSettingsTable1779180000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "email_provider_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "provider" varchar NOT NULL DEFAULT 'brevo',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_email_provider_settings_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "email_provider_settings"`);
  }
}
