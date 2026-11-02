import { useNavigate } from "react-router-dom";
import { Anchor, Box, Flex, LoadingOverlay, Text, Title } from "@mantine/core";
import { ROUTES } from "../../../routes/routes";
import { useDraftHiringRequest } from "../hooks/useDraftHiringRequest";
import { HiringRequestForm } from "../form/HiringRequestForm";

export default function NewHiringRequestPage() {
  const navigate = useNavigate();
  const {
    form,
    saveStatus,
    lastSavedAt,
    loadingDraft,
    submitting,
    savingDraft,
    user,
    managers,
    today,
    handleManualSave,
    onSubmit,
  } = useDraftHiringRequest({ draftId: null });

  return (
    <>
      <Anchor
        component="button"
        size="sm"
        c="dimmed"
        mb="sm"
        onClick={() => navigate(ROUTES.HIRING_REQUESTS)}
      >
        Back to requests
      </Anchor>

      <Flex justify="space-between" align="flex-start" mb="xl" gap="md">
        <Box>
          <Title order={2}>New Hiring Request</Title>
          <Text size="sm" c="dimmed" mt={4}>
            Your progress is saved automatically. Submit when ready.
          </Text>
        </Box>
      </Flex>

      <div style={{ position: "relative" }}>
        <LoadingOverlay visible={loadingDraft} />
        <HiringRequestForm
          mode="draft"
          form={form}
          managers={managers}
          today={today}
          user={user}
          onFormSubmit={onSubmit}
          submitting={submitting}
          savingDraft={savingDraft}
          onSaveDraft={handleManualSave}
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt}
        />
      </div>
    </>
  );
}
