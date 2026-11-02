import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeApplicationJobNullable1782824953592 implements MigrationInterface {
    name = 'MakeApplicationJobNullable1782824953592'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "applications" ALTER COLUMN "jobId" DROP NOT NULL`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "applications" ALTER COLUMN "jobId" SET NOT NULL`
        );
    }

}
