import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHiringRequestDeadline1777968013456 implements MigrationInterface {
    name = 'AddHiringRequestDeadline1777968013456'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hiring_requests" ADD "deadline" date`);
        await queryRunner.query(`ALTER TYPE "public"."hiring_requests_status_enum" RENAME TO "hiring_requests_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."hiring_requests_status_enum" AS ENUM('pending', 'in_review', 'approved', 'rejected', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" ALTER COLUMN "status" TYPE "public"."hiring_requests_status_enum" USING "status"::"text"::"public"."hiring_requests_status_enum"`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."hiring_requests_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."hiring_requests_status_enum_old" AS ENUM('pending', 'approved', 'rejected', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" ALTER COLUMN "status" TYPE "public"."hiring_requests_status_enum_old" USING "status"::"text"::"public"."hiring_requests_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."hiring_requests_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."hiring_requests_status_enum_old" RENAME TO "hiring_requests_status_enum"`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" DROP COLUMN "deadline"`);
    }

}
