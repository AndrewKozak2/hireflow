import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from "bcrypt";

export class SeedAdmin1776861846352 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash("Admin_123", salt);
    const email = "admin@hireflow.com";

    const userExists = (await queryRunner.query(
      `SELECT id FROM "users" WHERE email = $1`,
      [email],
    )) as { id: string }[];

    if (userExists.length === 0) {
      await queryRunner.query(
        `INSERT INTO "users" (email, name, password_hash, role, is_active) 
                 VALUES ($1, $2, $3, $4, $5)`,
        [email, "System Admin", passwordHash, "admin", true],
      );
      console.log("✅ Admin user seeded successfully");
    } else {
      console.log("⚠️ Admin user already exists, skipping seed");
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "users" WHERE email = 'admin@hireflow.com'`,
    );
  }
}
