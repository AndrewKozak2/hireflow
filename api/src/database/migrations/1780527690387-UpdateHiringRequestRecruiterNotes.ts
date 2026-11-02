import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateHiringRequestRecruiterNotes1780527690387 implements MigrationInterface {
    name = 'UpdateHiringRequestRecruiterNotes1780527690387'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hiring_requests" ADD "hm_notes_for_recruiter" text`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" DROP COLUMN "notes_for_recruiter"`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" ADD "notes_for_recruiter" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hiring_requests" DROP COLUMN "notes_for_recruiter"`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" ADD "notes_for_recruiter" text`);
        await queryRunner.query(`ALTER TABLE "hiring_requests" DROP COLUMN "hm_notes_for_recruiter"`);
    }

}
