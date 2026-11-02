import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJobListingFields1777967407700 implements MigrationInterface {
    name = 'AddJobListingFields1777967407700'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."job_listings_status_enum" AS ENUM('draft', 'pending_approval', 'active', 'paused', 'closed')`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "status" "public"."job_listings_status_enum" NOT NULL DEFAULT 'draft'`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "recruiter_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD "hiring_manager_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD CONSTRAINT "FK_2e49fe6c3581319462bd52ed3ef" FOREIGN KEY ("recruiter_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_listings" ADD CONSTRAINT "FK_4893132c4c9793c246089a8edf1" FOREIGN KEY ("hiring_manager_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_listings" DROP CONSTRAINT "FK_4893132c4c9793c246089a8edf1"`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP CONSTRAINT "FK_2e49fe6c3581319462bd52ed3ef"`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "hiring_manager_id"`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "recruiter_id"`);
        await queryRunner.query(`ALTER TABLE "job_listings" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."job_listings_status_enum"`);
    }

}
