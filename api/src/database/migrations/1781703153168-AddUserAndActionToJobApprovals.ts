import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserAndActionToJobApprovals1781703153168 implements MigrationInterface {
    name = 'AddUserAndActionToJobApprovals1781703153168'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_approvals" ADD "action" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_approvals" ADD "user_id" uuid`);
        await queryRunner.query(`ALTER TABLE "job_approvals" ADD CONSTRAINT "FK_9e3d109d8e3e64db28638a61d17" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_approvals" DROP CONSTRAINT "FK_9e3d109d8e3e64db28638a61d17"`);
        await queryRunner.query(`ALTER TABLE "job_approvals" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "job_approvals" DROP COLUMN "action"`);
    }

}
