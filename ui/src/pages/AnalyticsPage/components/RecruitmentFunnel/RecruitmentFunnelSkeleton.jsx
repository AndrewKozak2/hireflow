import { Card, Skeleton, Stack } from "@mantine/core";

const TITLE_HEIGHT = 18;
const TITLE_WIDTH = 150;
const STAGE_COUNT = 6;
const STAGE_HEIGHT = 28;
const STAGE_GAP = 16;
const INITIAL_STAGE_WIDTH_PERCENT = 100;
const STAGE_WIDTH_STEP_PERCENT = 10;

export function RecruitmentFunnelSkeleton() {
  return (
    <Card withBorder radius="md" p="lg">
      <Skeleton h={TITLE_HEIGHT} w={TITLE_WIDTH} radius="sm" mb="lg" />
      <Stack gap={STAGE_GAP}>
        {Array.from({ length: STAGE_COUNT }, (_, index) => (
          <Skeleton
            key={index}
            h={STAGE_HEIGHT}
            w={`${INITIAL_STAGE_WIDTH_PERCENT - index * STAGE_WIDTH_STEP_PERCENT}%`}
            radius="sm"
          />
        ))}
      </Stack>
    </Card>
  );
}
