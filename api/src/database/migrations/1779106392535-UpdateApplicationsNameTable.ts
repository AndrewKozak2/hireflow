import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateApplicationsNameTable1779106392535 implements MigrationInterface {
    name = 'UpdateApplicationsNameTable1779106392535'

      async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "application" RENAME TO "applications"
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "applications" RENAME TO "application"
    `);
  }

}
