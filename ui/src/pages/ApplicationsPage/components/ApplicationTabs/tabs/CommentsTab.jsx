import {
  Avatar,
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { useState } from "react";
import { useDateTime } from "../../../../../hooks/useDateTime";
import { ApplicationsService } from "../../../../../services/ApplicationsService";

const ROLE_LABELS = {
  recruiter: "Recruiter",
  hiring_manager: "Hiring Manager",
  admin: "Admin",
};

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function CommentItem({ comment }) {
  const { formatRelativeDate } = useDateTime();
  const author = comment.author;
  const roleLabel = author?.role ? ROLE_LABELS[author.role] : null;

  return (
    <Group align="flex-start" gap="sm" wrap="nowrap">
      <Avatar size={36} radius="xl" color="indigo">
        {getInitials(author?.name)}
      </Avatar>
      <Stack gap={4} style={{ flex: 1 }}>
        <Group gap="xs" align="center">
          <Text size="sm" fw={600}>
            {author?.name ?? "Unknown"}
          </Text>
          {roleLabel && (
            <Text size="xs" c="dimmed">
              · {roleLabel}
            </Text>
          )}
          <Text size="xs" c="dimmed" ml="auto">
            {formatRelativeDate(comment.createdAt)}
          </Text>
        </Group>
        <Text size="sm">{comment.content}</Text>
      </Stack>
    </Group>
  );
}

export function CommentsTab({ application, onRefresh }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const comments = application?.comments ?? [];
  const sorted = [...comments].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );

  const handleSave = async () => {
    if (!text.trim() || !application?.id) return;
    setSaving(true);
    try {
      await ApplicationsService.addComment(application.id, text.trim());
      setText("");
      onRefresh?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="md">
      <Card withBorder radius="md" p="lg">
        <Stack gap="sm">
          <Textarea
            placeholder="Add a comment..."
            minRows={3}
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button
              size="sm"
              onClick={handleSave}
              loading={saving}
              disabled={!text.trim()}
            >
              Save comment
            </Button>
          </Group>
        </Stack>
      </Card>

      {sorted.length > 0 && (
        <Stack gap="lg">
          {sorted.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
