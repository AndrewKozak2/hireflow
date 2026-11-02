import { MigrationInterface, QueryRunner } from "typeorm";

export class AddScoreCardFields1782934880919 implements MigrationInterface {
    name = 'AddScoreCardFields1782934880919'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "score_cards" ADD "technicalSkillsScore" integer`);
        await queryRunner.query(`ALTER TABLE "score_cards" ADD "problemSolvingScore" integer`);
        await queryRunner.query(`ALTER TABLE "score_cards" ADD "communicationScore" integer`);
        await queryRunner.query(`ALTER TABLE "score_cards" ADD "teamFitScore" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "score_cards" DROP COLUMN "teamFitScore"`);
        await queryRunner.query(`ALTER TABLE "score_cards" DROP COLUMN "communicationScore"`);
        await queryRunner.query(`ALTER TABLE "score_cards" DROP COLUMN "problemSolvingScore"`);
        await queryRunner.query(`ALTER TABLE "score_cards" DROP COLUMN "technicalSkillsScore"`);
    }

}
