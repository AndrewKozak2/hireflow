import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateJobAndApprovalTables1777291979912 implements MigrationInterface {
  name = 'CreateJobAndApprovalTables1777291979912';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_password_reset_tokens_user"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_password_reset_tokens_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "status" TO "is_active"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."users_status_enum" RENAME TO "users_is_active_enum"`,
    );
    await queryRunner.query(
      `CREATE TABLE "job_approvals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" character varying NOT NULL, "comment" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "job_id" uuid, CONSTRAINT "PK_439e45c6759590af9fed977cec7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "job_listings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ce5adead49e5fbf2df55e1917c1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'recruiter', 'manager')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_active"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."invitations_role_enum" RENAME TO "invitations_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invitations_role_enum" AS ENUM('admin', 'recruiter', 'manager')`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ALTER COLUMN "role" TYPE "public"."invitations_role_enum" USING "role"::"text"::"public"."invitations_role_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."invitations_role_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "job_approvals" ADD CONSTRAINT "FK_3f918cef0053170f2a7fbc0be04" FOREIGN KEY ("job_id") REFERENCES "job_listings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_approvals" DROP CONSTRAINT "FK_3f918cef0053170f2a7fbc0be04"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invitations_role_enum_old" AS ENUM('admin', 'recruiter', 'hiring_manager', 'viewer')`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ALTER COLUMN "role" TYPE "public"."invitations_role_enum_old" USING "role"::"text"::"public"."invitations_role_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."invitations_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."invitations_role_enum_old" RENAME TO "invitations_role_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_active"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "is_active" "public"."users_is_active_enum" NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum_old" AS ENUM('admin', 'recruiter', 'hiring_manager', 'viewer')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum_old" USING "role"::"text"::"public"."users_role_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum_old" RENAME TO "users_role_enum"`,
    );
    await queryRunner.query(`DROP TABLE "job_listings"`);
    await queryRunner.query(`DROP TABLE "job_approvals"`);
    await queryRunner.query(
      `ALTER TYPE "public"."users_is_active_enum" RENAME TO "users_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "is_active" TO "status"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_password_reset_tokens_user_id" ON "password_reset_tokens" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_password_reset_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
