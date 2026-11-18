import { ApplicationsService } from "../../../services/ApplicationsService";

/**
 * Assigns a job to an application, then starts AI screening against that job
 * in the background, the same way adding an application does.
 *
 * Resolves as soon as the job is saved. `screening` resolves later with the
 * screened application, or with null when screening failed — the job stays
 * assigned either way.
 */
export async function assignJobAndRunScreening(applicationId, jobId) {
  await ApplicationsService.updateApplication(applicationId, { jobId });

  const screening = ApplicationsService.runScreeningFromExistingCv(
    applicationId,
  )
    .then((response) => response?.data ?? null)
    .catch((error) => {
      console.error("AI screening after job assignment failed:", error);
      return null;
    });

  return { screening };
}
