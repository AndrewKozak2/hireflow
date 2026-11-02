import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJobIdInHiringRequests1780569587946 implements MigrationInterface {
    name = 'AddJobIdInHiringRequests1780569587946'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hiring_requests" ADD "job_id" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hiring_requests" DROP COLUMN "job_id"`);
    }

}
