import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MantineProvider } from "@mantine/core";
import { PossibleJobsCard } from "./PossibleJobsCard";
import { ApplicationsService } from "../../../../services/ApplicationsService";
import { assignJobAndRunScreening } from "../../utils/assignJobAndRunScreening";
import { useAuthStore } from "../../../../stores/useAuthStore";

vi.mock("../../../../services/ApplicationsService", () => ({
  ApplicationsService: { getJobSuggestions: vi.fn() },
}));
vi.mock("../../utils/assignJobAndRunScreening", () => ({
  assignJobAndRunScreening: vi.fn(),
}));
vi.mock("../../../../stores/useAuthStore", () => ({
  useAuthStore: vi.fn(),
}));
vi.mock("@mantine/notifications", () => ({
  notifications: { show: vi.fn() },
}));

const suggestion = {
  applicationId: "app-1",
  status: "ambiguous",
  appliedRole: "Фронтенд девелопер",
  options: [
    {
      jobId: "junior-fe",
      title: "Junior Frontend Developer (React)",
      source: "email",
      confidence: null,
      reason: null,
    },
    {
      jobId: "middle-fe",
      title: "Middle Frontend Developer",
      source: "email",
      confidence: null,
      reason: null,
    },
  ],
};

const renderCard = (application, onRefresh = vi.fn()) =>
  render(
    <MantineProvider>
      <PossibleJobsCard application={application} onRefresh={onRefresh} />
    </MantineProvider>,
  );

const asRole = (role) =>
  useAuthStore.mockImplementation((select) => select({ user: { role } }));

describe("PossibleJobsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asRole("recruiter");
    ApplicationsService.getJobSuggestions.mockResolvedValue({
      "app-1": suggestion,
    });
  });

  it("lists the jobs the email could mean", async () => {
    renderCard({ id: "app-1", jobId: null });

    expect(await screen.findByText("Possible jobs")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The email mentions «Фронтенд девелопер», which fits several open jobs. Pick the right one.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Junior Frontend Developer (React)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Middle Frontend Developer")).toBeInTheDocument();
    expect(screen.getAllByText("From email")).toHaveLength(2);
  });

  it("assigns the chosen job and refreshes the application", async () => {
    const onRefresh = vi.fn();
    assignJobAndRunScreening.mockResolvedValue({
      screening: Promise.resolve({ aiScore: 74 }),
    });
    renderCard({ id: "app-1", jobId: null }, onRefresh);

    const buttons = await screen.findAllByRole("button", { name: "Assign" });
    await userEvent.click(buttons[1]);

    expect(assignJobAndRunScreening).toHaveBeenCalledWith("app-1", "middle-fe");
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(2));
  });

  it("expands and collapses an AI reason on click", async () => {
    const reason =
      "Strong NestJS and PostgreSQL experience. However, the role asks for 3+ years and the candidate has 2.5.";
    ApplicationsService.getJobSuggestions.mockResolvedValue({
      "app-1": {
        applicationId: "app-1",
        status: "none",
        appliedRole: null,
        options: [
          {
            jobId: "middle-be",
            title: "Middle Backend Developer",
            source: "ai",
            confidence: "medium",
            reason,
          },
        ],
      },
    });
    renderCard({ id: "app-1", jobId: null });

    const reasonText = await screen.findByText(reason);
    expect(reasonText).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(reasonText);
    expect(reasonText).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(reasonText);
    expect(reasonText).toHaveAttribute("aria-expanded", "false");
  });

  it("shows nothing for an application that already has a job", async () => {
    renderCard({ id: "app-1", jobId: "qa" });

    await waitFor(() =>
      expect(ApplicationsService.getJobSuggestions).not.toHaveBeenCalled(),
    );
    expect(screen.queryByText("Possible jobs")).not.toBeInTheDocument();
  });

  it("shows nothing to a hiring manager, who cannot assign jobs", async () => {
    asRole("hiring_manager");
    renderCard({ id: "app-1", jobId: null });

    await waitFor(() =>
      expect(ApplicationsService.getJobSuggestions).not.toHaveBeenCalled(),
    );
    expect(screen.queryByText("Possible jobs")).not.toBeInTheDocument();
  });

  it("shows nothing when there is nothing to suggest", async () => {
    ApplicationsService.getJobSuggestions.mockResolvedValue({});
    renderCard({ id: "app-1", jobId: null });

    await waitFor(() =>
      expect(ApplicationsService.getJobSuggestions).toHaveBeenCalledWith([
        "app-1",
      ]),
    );
    expect(screen.queryByText("Possible jobs")).not.toBeInTheDocument();
  });
});
