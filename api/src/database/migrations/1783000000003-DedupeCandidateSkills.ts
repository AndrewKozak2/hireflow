import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Removes skills that repeat with different case ("Employer branding" and
 * "Employer Branding") from existing candidates. Merging CV and screening
 * skills used to keep both; new merges are deduplicated in code. The first
 * spelling wins and the order is kept.
 */
export class DedupeCandidateSkills1783000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "candidates" c
      SET "skills" = deduped.skills
      FROM (
        SELECT id, array_agg(skill ORDER BY ord) AS skills
        FROM (
          SELECT
            c2.id,
            btrim(u.skill) AS skill,
            u.ord,
            row_number() OVER (
              PARTITION BY c2.id, lower(btrim(u.skill))
              ORDER BY u.ord
            ) AS rn
          FROM "candidates" c2
          CROSS JOIN LATERAL unnest(c2."skills") WITH ORDINALITY AS u(skill, ord)
          WHERE btrim(u.skill) <> ''
        ) numbered
        WHERE rn = 1
        GROUP BY id
      ) deduped
      WHERE c.id = deduped.id AND c."skills" IS DISTINCT FROM deduped.skills
    `);
  }

  public async down(): Promise<void> {
    // The removed repeats carried no information, so there is nothing to restore.
  }
}
