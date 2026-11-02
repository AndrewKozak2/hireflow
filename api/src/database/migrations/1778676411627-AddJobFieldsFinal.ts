import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJobFieldsFinal1778676411627 implements MigrationInterface {
    name = 'AddJobFieldsFinal1778676411627'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "employment_type" character varying`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "location" character varying`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "requirements" text`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "nice_to_have" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "nice_to_have"`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "requirements"`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "employment_type"`);
    }

}
