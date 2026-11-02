import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAdminEmail1776861846353 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const oldEmail = "admin@hireflow.com";
    const newEmail = "fireflow.dev@gmail.com";

    const userExists = (await queryRunner.query(
      `SELECT id FROM "users" WHERE email = $1`,
      [oldEmail],
    )) as { id: string }[];

    if (userExists.length > 0) {
      await queryRunner.query(
        `UPDATE "users" SET email = $1 WHERE email = $2`,
        [newEmail, oldEmail],
      );
      console.log(`✅ Admin email updated from ${oldEmail} to ${newEmail}`);
    } else {
      console.log(`⚠️ User with email ${oldEmail} not found, skipping update`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const currentEmail = "fireflow.dev@gmail.com";
    const originalEmail = "admin@hireflow.com";

    const userExists = (await queryRunner.query(
      `SELECT id FROM "users" WHERE email = $1`,
      [currentEmail],
    )) as { id: string }[];

    if (userExists.length > 0) {
      await queryRunner.query(
        `UPDATE "users" SET email = $1 WHERE email = $2`,
        [originalEmail, currentEmail],
      );
      console.log(`✅ Admin email reverted from ${currentEmail} to ${originalEmail}`);
    } else {
      console.log(`⚠️ User with email ${currentEmail} not found, skipping revert`);
    }
  }
}
