import { useRef, useState } from "react";
import {
  Anchor,
  Badge,
  Box,
  Card,
  Divider,
  Group,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconFileDescription, IconUpload } from "@tabler/icons-react";
import { useDateTime } from "../../../../hooks/useDateTime";
import { CandidatesService } from "../../../../services/CandidatesService";
import { ApplicationsService } from "../../../../services/ApplicationsService";
import { decodeUploadedFilename } from "../../../../utils/filename";

export function CvPreviewCard({ application, onRefresh }) {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const { formatRelativeDate } = useDateTime();

  const applicationId = application?.id;
  const candidateId = application?.candidate?.id;
  const cvs = application?.candidate?.cvs ?? [];
  const sortedCvs = [...cvs].sort(
    (a, b) =>
      new Date(b.uploadedAt ?? b.createdAt) -
      new Date(a.uploadedAt ?? a.createdAt),
  );

  const handleFileChange = async (e) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!file || !applicationId) return;
    setIsUploading(true);
    try {
      await ApplicationsService.uploadCv(applicationId, file);
      onRefresh?.();
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenCv = async (cv) => {
    const cvWindow = window.open("", "_blank");
    try {
      const url = await CandidatesService.getCandidateCvUrl(candidateId, cv.id);
      if (cvWindow) {
        cvWindow.location.href = url;
      }
    } catch {
      cvWindow?.close();
      notifications.show({
        title: "Error",
        message: "Could not open CV",
        color: "red",
      });
    }
  };

  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Text fw={700} size="md">
            CV
          </Text>
          <Anchor
            size="sm"
            c="blue"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
            }}
            onClick={() => inputRef.current?.click()}
          >
            <IconUpload size={14} />
            {isUploading ? "Uploading…" : "Upload"}
          </Anchor>
        </Group>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={handleFileChange}
        />

        {sortedCvs.length > 0 ? (
          <Stack gap="sm">
            {sortedCvs.map((cv, index) => (
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
                        p={0}
                        bd={0}
                        c="blue"
                        onClick={() => handleOpenCv(cv)}
                        style={{
                          appearance: "none",
                          background: "transparent",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        {decodeUploadedFilename(cv.originalFilename)}
                      </Text>
                      <Text size="11px" c="dimmed" mt="2px">
                        {formatRelativeDate(cv.uploadedAt ?? cv.createdAt)}
                      </Text>
                    </Stack>
                  </Group>
                  {cv.isCurrent && (
                    <Badge
                      color="green"
                      variant="light"
                      radius="xl"
                      size="md"
                      tt="uppercase"
                    >
                      Current
                    </Badge>
                  )}
                </Group>
                {index < sortedCvs.length - 1 && <Divider />}
              </Stack>
            ))}
          </Stack>
        ) : (
          <Box
            p="md"
            style={{
              border: "1px solid var(--mantine-color-gray-2)",
              borderRadius: "var(--mantine-radius-sm)",
              backgroundColor: "var(--mantine-color-gray-0)",
            }}
          >
            <Stack gap="sm">
              <Skeleton height={10} width="80%" radius="xl" />
              <Skeleton height={8} width="60%" radius="xl" />
              <Skeleton height={8} width="90%" radius="xl" />
              <Skeleton height={8} width="50%" radius="xl" />
              <Skeleton height={8} width="75%" radius="xl" mt={6} />
              <Skeleton height={8} width="65%" radius="xl" />
            </Stack>
          </Box>
        )}
      </Stack>
    </Card>
  );
}
