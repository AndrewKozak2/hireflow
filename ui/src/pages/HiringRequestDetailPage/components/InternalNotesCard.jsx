import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Textarea,
  useMantineTheme,
} from "@mantine/core";
import { formatShortDateTime } from "../../../utils/dateFormatters";
import classes from "./InternalNotesCard.module.css";

export function InternalNotesCard({
  canManageInternalNotes,
  existingNotes = [],
  notes,
  onChange,
  onSave,
  isSaving,
  isSaved,
  isDisabled = false,
}) {
  const theme = useMantineTheme();
  const notesListRef = useRef(null);
  const textareaRef = useRef(null);
  const [notesScrollIndicator, setNotesScrollIndicator] = useState({
    visible: false,
    top: 0,
    height: 0,
  });
  const [scrollIndicator, setScrollIndicator] = useState({
    visible: false,
    top: 0,
    height: 0,
  });

  useEffect(() => {
    const notesList = notesListRef.current;

    if (notesList) {
      notesList.scrollTop = notesList.scrollHeight;
    }
  }, [existingNotes.length]);

  useEffect(() => {
    const notesList = notesListRef.current;

    if (!notesList) {
      return undefined;
    }

    const updateNotesScrollIndicator = () => {
      const hasOverflow = notesList.scrollHeight > notesList.clientHeight + 1;

      if (!hasOverflow) {
        setNotesScrollIndicator((current) =>
          current.visible ? { visible: false, top: 0, height: 0 } : current,
        );
        return;
      }

      const thumbHeight = Math.max(
        (notesList.clientHeight / notesList.scrollHeight) *
          notesList.clientHeight,
        44,
      );
      const maxScrollTop = notesList.scrollHeight - notesList.clientHeight;
      const maxThumbTop = notesList.clientHeight - thumbHeight;
      const top =
        maxScrollTop > 0
          ? (notesList.scrollTop / maxScrollTop) * maxThumbTop
          : 0;

      setNotesScrollIndicator({
        visible: true,
        top,
        height: thumbHeight,
      });
    };

    updateNotesScrollIndicator();

    notesList.addEventListener("scroll", updateNotesScrollIndicator);

    const resizeObserver = new ResizeObserver(updateNotesScrollIndicator);
    resizeObserver.observe(notesList);

    return () => {
      notesList.removeEventListener("scroll", updateNotesScrollIndicator);
      resizeObserver.disconnect();
    };
  }, [existingNotes.length]);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return undefined;
    }

    const updateScrollIndicator = () => {
      const hasOverflow = textarea.scrollHeight > textarea.clientHeight + 1;

      if (!hasOverflow) {
        setScrollIndicator((current) =>
          current.visible ? { visible: false, top: 0, height: 0 } : current,
        );
        return;
      }

      const thumbHeight = Math.max(
        (textarea.clientHeight / textarea.scrollHeight) * textarea.clientHeight,
        44,
      );
      const maxScrollTop = textarea.scrollHeight - textarea.clientHeight;
      const maxThumbTop = textarea.clientHeight - thumbHeight;
      const top =
        maxScrollTop > 0
          ? (textarea.scrollTop / maxScrollTop) * maxThumbTop
          : 0;

      setScrollIndicator({
        visible: true,
        top,
        height: thumbHeight,
      });
    };

    updateScrollIndicator();

    textarea.addEventListener("scroll", updateScrollIndicator);

    const resizeObserver = new ResizeObserver(updateScrollIndicator);
    resizeObserver.observe(textarea);

    return () => {
      textarea.removeEventListener("scroll", updateScrollIndicator);
      resizeObserver.disconnect();
    };
  }, [notes]);

  if (!canManageInternalNotes) {
    return null;
  }

  return (
    <Card className={classes.card} radius="lg" p="lg">
      <Stack gap="sm">
        <Text
          className={classes.title}
          size="xs"
          fw={700}
          tt="uppercase"
          c={theme.colors.gray[6]}
        >
          Internal notes (NON VISIBLE FOR HM)
        </Text>

        {existingNotes.length > 0 ? (
          <Box className={classes.scrollContainer}>
            <Box ref={notesListRef} className={classes.notesList}>
              <Stack gap="xs">
                {existingNotes.map((note) => (
                  <Box className={classes.noteItem} key={note.id} p="sm">
                    <Group justify="space-between" gap="sm" mb={4}>
                      <Group gap={4}>
                        <Text size="xs" fw={600} c={theme.colors.gray[8]}>
                          {note.author?.name || "Recruiter"}
                        </Text>
                        {note.author?.role && (
                          <Text size="xs" c={theme.colors.gray[6]}>
                            ({note.author.role.replace(/_/g, " ")})
                          </Text>
                        )}
                      </Group>
                      <Text size="xs" c={theme.colors.gray[5]}>
                        {formatShortDateTime(note.date_time)}
                      </Text>
                    </Group>
                    <Text size="sm" c={theme.colors.gray[8]}>
                      {note.text}
                    </Text>
                  </Box>
                ))}
              </Stack>
            </Box>

            {notesScrollIndicator.visible ? (
              <Box
                className={classes.scrollTrack}
                style={{
                  "--scroll-thumb-top": `${notesScrollIndicator.top}px`,
                  "--scroll-thumb-height": `${notesScrollIndicator.height}px`,
                }}
              >
                <Box className={classes.scrollThumb} />
              </Box>
            ) : null}
          </Box>
        ) : (
          <Text size="sm" c={theme.colors.gray[5]}>
            No internal notes yet
          </Text>
        )}

        <Box className={classes.textareaWrapper}>
          <Textarea
            ref={textareaRef}
            value={notes}
            onChange={(event) => onChange(event.currentTarget.value)}
            minRows={4}
            radius="md"
            placeholder="Add a new internal note..."
            classNames={{
              input: classes.notesInput,
            }}
          />

          {scrollIndicator.visible ? (
            <Box
              className={`${classes.scrollTrack} ${classes.textareaScrollTrack}`}
              style={{
                "--scroll-thumb-top": `${scrollIndicator.top}px`,
                "--scroll-thumb-height": `${scrollIndicator.height}px`,
              }}
            >
              <Box className={classes.scrollThumb} />
            </Box>
          ) : null}
        </Box>

        <Group justify="space-between" align="center">
          <Button
            size="sm"
            radius="md"
            onClick={onSave}
            loading={isSaving}
            disabled={isDisabled}
          >
            Save
          </Button>

          <Text
            size="xs"
            c={
              isSaving
                ? theme.colors.gray[6]
                : isSaved
                  ? theme.colors.success[7]
                  : theme.colors.gray[6]
            }
          >
            {isSaving ? "Saving..." : isSaved ? "Saved ✓" : ""}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
}
