import { Group, Skeleton, Stack } from "@mantine/core";

export function CandidateProfileSkeleton() {
  return (
    <>
      <Stack gap="xl">
        <Skeleton height={18} width={132} radius="xl" />
        <Group justify="space-between" align="flex-start" gap="lg">
          <Group gap="md" align="center">
            <Skeleton circle height={80} width={80} />
            <Stack gap="xs">
              <Skeleton height={30} width={250} radius="xl" />
              <Skeleton height={18} width={360} radius="xl" />
            </Stack>
          </Group>
          <Skeleton height={40} width={168} radius="md" />
        </Group>
        <Stack gap="md">
          <Group gap="md">
            <Skeleton height={34} width={124} radius="xl" />
            <Skeleton height={34} width={92} radius="xl" />
            <Skeleton height={34} width={80} radius="xl" />
          </Group>
          <Skeleton height={220} radius="xl" />
        </Stack>
      </Stack>
    </>
  );
}
