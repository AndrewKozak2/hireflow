import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailSourceToEnum1781177367791 implements MigrationInterface {
    name = 'AddEmailSourceToEnum1781177367791'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."applications_source_enum" RENAME TO "applications_source_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."applications_source_enum" AS ENUM('djinni', 'dou', 'linkedin', 'manual', 'referral', 'talent_pool', 'email')`);
        await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "source" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "source" TYPE "public"."applications_source_enum" USING "source"::"text"::"public"."applications_source_enum"`);
        await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "source" SET DEFAULT 'manual'`);
        await queryRunner.query(`DROP TYPE "public"."applications_source_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."applications_source_enum_old" AS ENUM('djinni', 'dou', 'linkedin', 'manual', 'referral', 'talent_pool')`);
        await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "source" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "source" TYPE "public"."applications_source_enum_old" USING "source"::"text"::"public"."applications_source_enum_old"`);
        await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "source" SET DEFAULT 'manual'`);
        await queryRunner.query(`DROP TYPE "public"."applications_source_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."applications_source_enum_old" RENAME TO "applications_source_enum"`);
    }

}
