import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserStatusField1777372455369 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "is_active" TO "status"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" TYPE varchar`);
        await queryRunner.query(`UPDATE "users" SET "status" = 'active' WHERE "status" = 'true'`);
        await queryRunner.query(`UPDATE "users" SET "status" = 'deactivate' WHERE "status" = 'false'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "users" SET "status" = 'true' WHERE "status" = 'active'`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" TYPE boolean USING "status"::boolean`);
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "status" TO "is_active"`);
    }

}