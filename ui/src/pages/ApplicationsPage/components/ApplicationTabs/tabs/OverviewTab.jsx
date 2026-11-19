import { Grid, Stack } from "@mantine/core";
import { AIScreeningCard } from "../../AIScreeningCard/AIScreeningCard";
import { ContactCard } from "../../ContactCard/ContactCard";
import { CvPreviewCard } from "../../CvPreviewCard/CvPreviewCard";
import { PossibleJobsCard } from "../../PossibleJobsCard/PossibleJobsCard";
import { QuickActionsCard } from "../../QuickActionsCard/QuickActionsCard";
import { ScoreCardPreview } from "../../ScoreCardPreview/ScoreCardPreview";

export function OverviewTab({ application, onRefresh }) {
  return (
    <Grid gutter="md">
      <Grid.Col span={{ base: 12, md: 8 }}>
        <Stack gap="md">
          <ContactCard application={application} onRefresh={onRefresh} />
          <PossibleJobsCard application={application} onRefresh={onRefresh} />
          <AIScreeningCard application={application} />
          <ScoreCardPreview
            application={application}
            scoreCard={application.scoreCards?.[0]}
            onScoreCardGenerated={() => onRefresh()}
          />
        </Stack>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Stack gap="md">
          <QuickActionsCard application={application} onRefresh={onRefresh} />
          <CvPreviewCard application={application} onRefresh={onRefresh} />
        </Stack>
      </Grid.Col>
    </Grid>
  );
}
