import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRolesEnum1776766759269 implements MigrationInterface {
  name = "UpdateRolesEnum1776766759269";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'recruiter', 'hiring_manager', 'viewer')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."invitations_role_enum" RENAME TO "invitations_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invitations_role_enum" AS ENUM('admin', 'recruiter', 'hiring_manager', 'viewer')`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ALTER COLUMN "role" TYPE "public"."invitations_role_enum" USING "role"::"text"::"public"."invitations_role_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."invitations_role_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."invitations_role_enum_old" AS ENUM('admin', 'user')`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ALTER COLUMN "role" TYPE "public"."invitations_role_enum_old" USING "role"::"text"::"public"."invitations_role_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."invitations_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."invitations_role_enum_old" RENAME TO "invitations_role_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum_old" AS ENUM('admin', 'user')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum_old" USING "role"::"text"::"public"."users_role_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum_old" RENAME TO "users_role_enum"`,
    );
  }
}
