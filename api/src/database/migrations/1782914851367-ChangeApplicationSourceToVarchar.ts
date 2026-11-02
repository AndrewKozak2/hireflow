import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeApplicationSourceToVarchar1782914851367 implements MigrationInterface {
    name = 'ChangeApplicationSourceToVarchar1782914851367'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "applications" DROP COLUMN "source"`);
        await queryRunner.query(`DROP TYPE "public"."applications_source_enum"`);
        await queryRunner.query(`ALTER TABLE "applications" ADD "source" character varying NOT NULL DEFAULT 'email'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "applications" DROP COLUMN "source"`);
        await queryRunner.query(`CREATE TYPE "public"."applications_source_enum" AS ENUM('djinni', 'dou', 'linkedin', 'manual', 'referral', 'talent_pool', 'email')`);
        await queryRunner.query(`ALTER TABLE "applications" ADD "source" "public"."applications_source_enum" NOT NULL DEFAULT 'manual'`);
    }

}
