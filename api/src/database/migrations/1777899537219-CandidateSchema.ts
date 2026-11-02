  import { MigrationInterface, QueryRunner } from "typeorm";
    
     export class CandidateSchema1777899537219 implements MigrationInterface {
         name = 'CandidateSchema1777899537219'
    
         public async up(queryRunner: QueryRunner): Promise<void> {
             await queryRunner.query(`CREATE TABLE "candidates" (
                 "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "firstName" character varying NOT NULL, 
                "lastName" character varying NOT NULL, 
                "email" character varying NOT NULL, 
                "phone" character varying, 
                "linkedinUrl" character varying, 
                "skills" text array NOT NULL DEFAULT '{}', 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_140681296bf033ab1eb95288abb" PRIMARY KEY ("id")
            )`);
   
            await queryRunner.query(`CREATE INDEX "IDX_063a069f2950d9f624a0f50f01" ON "candidates" ("lastName") `);
            await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c0de76a18c2a505ceb01674682" ON "candidates" ("email") `);
   
            await queryRunner.query(`CREATE TABLE "candidate_cvs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "candidateId" uuid NOT NULL, 
                "fileUrl" character varying NOT NULL, 
                "originalFilename" character varying NOT NULL, 
                "isCurrent" boolean NOT NULL DEFAULT true, 
                "uploadedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_8a97e0f90c9d2e9e83cb6ff3d02" PRIMARY KEY ("id")
            )`);
   
            await queryRunner.query(`CREATE INDEX "IDX_0df3b70f7ae09f22d3b3d87b1c" ON "candidate_cvs" ("candidateId") `);
   
            await queryRunner.query(`ALTER TABLE "candidate_cvs" ADD CONSTRAINT "FK_0df3b70f7ae09f22d3b3d87b1c2" FOREIGN KEY ("candidateId") REFERENCES
      "candidates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        }
   
        public async down(queryRunner: QueryRunner): Promise<void> {
            await queryRunner.query(`ALTER TABLE "candidate_cvs" DROP CONSTRAINT "FK_0df3b70f7ae09f22d3b3d87b1c2"`);
            await queryRunner.query(`DROP INDEX "public"."IDX_0df3b70f7ae09f22d3b3d87b1c"`);
            await queryRunner.query(`DROP TABLE "candidate_cvs"`);
            await queryRunner.query(`DROP INDEX "public"."IDX_c0de76a18c2a505ceb01674682"`);
            await queryRunner.query(`DROP INDEX "public"."IDX_063a069f2950d9f624a0f50f01"`);
            await queryRunner.query(`DROP TABLE "candidates"`);
        }
    }