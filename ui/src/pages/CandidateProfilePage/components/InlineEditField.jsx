import { ActionIcon, Box, Group, Stack, Text, TextInput } from "@mantine/core";
import { IconEdit } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { theme } from "../../../theming/theme";

export function InlineEditField({
  label,
  value,
  placeholder = "Not set",
  onSave,
  error,
  isSaving,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [isSaved, setIsSaved] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const showSavedFeedback = () => {
    setIsSaved(true);
    timeoutRef.current = window.setTimeout(() => setIsSaved(false), 2000);
  };

  const saveDraft = async () => {
    if ((draft ?? "") === (value ?? "")) {
      setIsEditing(false);
      return;
    }

    const success = await onSave(draft);
    if (success) {
      setIsEditing(false);
      showSavedFeedback();
    }
  };

  return (
    <Stack gap={4}>
      {isEditing ? (
        <Stack gap={6}>
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            {label}
          </Text>
          <TextInput
            value={draft}
            onChange={(event) => setDraft(event.currentTarget.value)}
            onBlur={saveDraft}
            onKeyDown={async (event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                await saveDraft();
              }

              if (event.key === "Escape") {
                setDraft(value ?? "");
                setIsEditing(false);
              }
            }}
            error={error}
            autoFocus
          />
          {isSaving ? (
            <Text size="xs" c="dimmed">
              Saving...
            </Text>
          ) : null}
        </Stack>
      ) : (
        <Stack gap={4}>
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              borderRadius: "0.5rem",
              paddingInline: "0.375rem",
            }}
          >
            <Group gap="xl" wrap="nowrap" style={{ flex: 1 }}>
              <Text
                size="sm"
                c="dimmed"
                style={{ minWidth: "12rem", flexShrink: 0 }}
              >
                {label}
              </Text>
              <Text
                size="sm"
                c={value ? theme.colors.gray[9] : "dimmed"}
                fw={500}
              >
                {value || placeholder}
              </Text>
            </Group>
            <ActionIcon
              size={16}
              variant="subtle"
              color={theme.colors.gray[5]}
              onClick={() => {
                setDraft(value ?? "");
                setIsEditing(true);
              }}
            >
              <IconEdit size={16} />
            </ActionIcon>
          </Box>

          <Text
            size="xs"
            c={error ? "red" : "green"}
            style={{
              opacity: error || isSaved ? 1 : 0,
              transition: "opacity 250ms ease",
            }}
          >
            {error || (isSaved ? "Saved ✓" : " ")}
          </Text>
        </Stack>
      )}
    </Stack>
  );
}
