import {
  Badge,
  Card,
  Divider,
  Grid,
  Group,
  Stack,
  Text,
  ThemeIcon,
  useMantineTheme,
} from "@mantine/core";
import { IconFileDescription } from "@tabler/icons-react";
import { SectionCard } from "./SectionCard";
import { InlineEditField } from "./InlineEditField";
import { CvUploader } from "./CvUploader";
import { SkillTagEditor } from "./SkillTagEditor";

export function CandidateProfileTab({
  candidate,
  errors,
  savingField,
  isUploadingCv,
  isSavingSkills,
  saveField,
  handleOpenCv,
  handleUploadCv,
  handleSaveSkills,
  formatRelativeDate,
}) {
  const theme = useMantineTheme();

  return (
    <Grid gutter="xl" align="start">
      <Grid.Col span={{ base: 12, md: 7 }}>
        <SectionCard title="Personal info">
          <Stack gap={theme.spacing.xs}>
            <InlineEditField
              label="First name"
              value={candidate.firstName}
              onSave={(value) => saveField("firstName", value)}
              error={errors.firstName}
              isSaving={savingField === "firstName"}
            />
            <Divider />
            <InlineEditField
              label="Last name"
              value={candidate.lastName}
              onSave={(value) => saveField("lastName", value)}
              error={errors.lastName}
              isSaving={savingField === "lastName"}
            />
            <Divider />
            <InlineEditField
              label="Phone"
              value={candidate.phone || ""}
              placeholder="Not set"
              onSave={(value) => saveField("phone", value)}
              error={errors.phone}
              isSaving={savingField === "phone"}
            />
            <Divider />
            <InlineEditField
              label="LinkedIn"
              value={candidate.linkedinUrl || ""}
              placeholder="Not set"
              onSave={(value) => saveField("linkedinUrl", value)}
              error={errors.linkedinUrl}
              isSaving={savingField === "linkedinUrl"}
            />
          </Stack>
        </SectionCard>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 5 }}>
        <Stack gap="xl">
          <SectionCard title="CV history">
            <Stack gap="md">
              {candidate.cvHistory?.length ? (
                <Stack gap="sm">
                  {candidate.cvHistory.map((cv, index) => (
                    <Stack key={cv.id} gap="sm">
                      <Group
                        justify="space-between"
                        align="center"
                        gap="sm"
                        wrap="nowrap"
                      >
                        <Group gap="md" wrap="nowrap" align="flex-start">
                          <ThemeIcon
                            variant="transparent"
                            color="gray"
                            size="lg"
                            mt={2}
                          >
                            <IconFileDescription size={22} />
                          </ThemeIcon>

                          <Stack gap={2}>
                            <Text
                              component="button"
                              type="button"
                              size="13px"
                              fw={500}
                              maw={280}
                              p={0}
                              bd={0}
                              c={theme.colors.blue[7]}
                              onClick={() => handleOpenCv(cv)}
                              style={{
                                appearance: "none",
                                background: "transparent",
                                cursor: "pointer",
                                textAlign: "left",
                              }}
                            >
                              {cv.fileName}
                            </Text>
                            <Text size="11px" c="dimmed" mt="5px">
                              {formatRelativeDate(cv.uploadedAt)}
                            </Text>
                          </Stack>
                        </Group>

                        {cv.isCurrent ? (
                          <Badge
                            color="success"
                            variant="light"
                            radius="xl"
                            size="md"
                            tt="uppercase"
                            styles={{
                              label: {
                                fontWeight: 700,
                                letterSpacing: "0.04em",
                              },
                            }}
                          >
                            Current
                          </Badge>
                        ) : null}
                      </Group>

                      {index < candidate.cvHistory.length - 1 ? (
                        <Divider />
                      ) : null}
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Text size="sm" c="dimmed">
                  No CVs uploaded yet.
                </Text>
              )}

              <CvUploader
                onUpload={handleUploadCv}
                isUploading={isUploadingCv}
              />
            </Stack>
          </SectionCard>

          <Card withBorder radius="xl" p="lg">
            <SkillTagEditor
              skills={candidate.skills}
              onSave={handleSaveSkills}
              isSaving={isSavingSkills}
            />
          </Card>
        </Stack>
      </Grid.Col>
    </Grid>
  );
}
