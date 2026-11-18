import { describe, it, expect, vi, beforeEach } from "vitest";
import { assignJobAndRunScreening } from "./assignJobAndRunScreening";
import { ApplicationsService } from "../../../services/ApplicationsService";

vi.mock("../../../services/ApplicationsService", () => ({
  ApplicationsService: {
    updateApplication: vi.fn(),
    runScreeningFromExistingCv: vi.fn(),
  },
}));

describe("assignJobAndRunScreening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("saves the job first, then screens the application against it", async () => {
    ApplicationsService.updateApplication.mockResolvedValue({});
    ApplicationsService.runScreeningFromExistingCv.mockResolvedValue({
      data: { id: "app-1", aiScore: 74, aiRecommendation: "proceed" },
    });

    const { screening } = await assignJobAndRunScreening("app-1", "job-1");

    expect(ApplicationsService.updateApplication).toHaveBeenCalledWith(
      "app-1",
      { jobId: "job-1" },
    );
    expect(ApplicationsService.runScreeningFromExistingCv).toHaveBeenCalledWith(
      "app-1",
    );
    expect(
      ApplicationsService.updateApplication.mock.invocationCallOrder[0],
    ).toBeLessThan(
      ApplicationsService.runScreeningFromExistingCv.mock
        .invocationCallOrder[0],
    );
    await expect(screening).resolves.toMatchObject({ aiScore: 74 });
  });

  it("does not start screening when the job could not be saved", async () => {
    ApplicationsService.updateApplication.mockRejectedValue(
      new Error("Forbidden"),
    );

    await expect(assignJobAndRunScreening("app-1", "job-1")).rejects.toThrow(
      "Forbidden",
    );
    expect(
      ApplicationsService.runScreeningFromExistingCv,
    ).not.toHaveBeenCalled();
  });

  it("keeps the job assigned and reports null when screening fails", async () => {
    ApplicationsService.updateApplication.mockResolvedValue({});
    ApplicationsService.runScreeningFromExistingCv.mockRejectedValue(
      new Error("No readable CV"),
    );

    const { screening } = await assignJobAndRunScreening("app-1", "job-1");

    await expect(screening).resolves.toBeNull();
  });
});
