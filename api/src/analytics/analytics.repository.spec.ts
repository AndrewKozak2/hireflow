import { DataSource } from "typeorm";
import { AnalyticsRepository } from "./analytics.repository";
import { UserRole } from "../auth/enums/userRole.enum";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";

describe("AnalyticsRepository", () => {
  const mockDataSource = { query: jest.fn().mockResolvedValue([]) };
  const repository = new AnalyticsRepository(
    mockDataSource as unknown as DataSource,
  );
  const admin = { sub: "admin-id", role: UserRole.ADMIN } as JwtPayload;

  beforeEach(() => mockDataSource.query.mockClear());

  describe("getRawMetrics — AI coverage", () => {
    const getMetricsSql = async (): Promise<string> => {
      await repository.getRawMetrics(
        "2026-11-01",
        "2026-11-30",
        "2026-10-02",
        "2026-10-31",
        admin,
      );
      const [sql] = mockDataSource.query.mock.calls[0] as [string, unknown[]];
      return sql.replace(/\s+/g, " ");
    };

    const aiAppsExpression = (sql: string, period: string): string => {
      const metricsBlock = sql.split(`${period}_metrics AS (`)[1] ?? "";
      const aiAppsLine = metricsBlock.split(" as ai_apps")[0] ?? "";
      return aiAppsLine.slice(aiAppsLine.lastIndexOf("COUNT(CASE WHEN"));
    };

    it.each(["current", "previous"])(
      "counts an application screened by AI on intake in the %s period",
      async (period) => {
        const expression = aiAppsExpression(await getMetricsSql(), period);

        expect(expression).toContain(`${period}_apps."aiScore" IS NOT NULL`);
      },
    );

    it.each(["current", "previous"])(
      "still counts an application with an AI interview score card in the %s period",
      async (period) => {
        const expression = aiAppsExpression(await getMetricsSql(), period);

        expect(expression).toContain(
          `EXISTS(SELECT 1 FROM score_cards sc WHERE sc."applicationId" = ${period}_apps.id)`,
        );
      },
    );

    it("selects aiScore in both period CTEs so the condition can use it", async () => {
      const sql = await getMetricsSql();

      expect(sql).toContain(
        `current_apps AS ( SELECT a.id, a.stage, a."createdAt", a."aiScore"`,
      );
      expect(sql).toContain(
        `previous_apps AS ( SELECT a.id, a.stage, a."createdAt", a."aiScore"`,
      );
    });
  });
});
