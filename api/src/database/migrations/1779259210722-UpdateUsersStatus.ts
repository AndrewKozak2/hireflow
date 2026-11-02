import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUsersStatus1779259210722 implements MigrationInterface {
    name = 'UpdateUsersStatus1779259210722';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "users" SET "status" = 'active' WHERE "role" = 'admin'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "users" SET "status" = 'pending' WHERE "role" = 'admin'`);
    }

}
