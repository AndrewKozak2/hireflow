import { useState } from "react";
import {
  ActionIcon,
  Anchor,
  Card,
  Group,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconBrandLinkedin,
  IconCheck,
  IconMail,
  IconPencil,
  IconPhone,
  IconX,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../../routes/routes";
import { CandidatesService } from "../../../../services/CandidatesService";

function ContactRow({
  icon: Icon,
  field,
  value,
  href,
  editingField,
  editValue,
  onEdit,
  onEditChange,
  onSave,
  onCancel,
}) {
  const isEditing = editingField === field;

  const handleKeyDown = (e) => {
    if (e.key === "Enter") onSave();
    if (e.key === "Escape") onCancel();
  };

  if (!value && !isEditing) return null;

  return (
    <Group justify="space-between" wrap="nowrap">
      <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
        <Icon
          size={16}
          color="var(--mantine-color-gray-6)"
          style={{ flexShrink: 0 }}
        />
        {isEditing ? (
          <TextInput
            value={editValue}
            onChange={(e) => onEditChange(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            size="xs"
            autoFocus
            style={{ flex: 1 }}
          />
        ) : href ? (
          <Anchor
            href={href}
            target="_blank"
            size="sm"
            c="blue"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {value}
          </Anchor>
        ) : (
          <Text
            size="sm"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {value}
          </Text>
        )}
      </Group>

      {isEditing ? (
        <Group gap={4} style={{ flexShrink: 0 }}>
          <ActionIcon size="sm" variant="subtle" color="green" onClick={onSave}>
            <IconCheck size={13} />
          </ActionIcon>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="gray"
            onClick={onCancel}
          >
            <IconX size={13} />
          </ActionIcon>
        </Group>
      ) : (
        <IconPencil
          size={14}
          color="var(--mantine-color-gray-5)"
          style={{ cursor: "pointer", flexShrink: 0 }}
          onClick={() => onEdit(field, value)}
        />
      )}
    </Group>
  );
}

export function ContactCard({ application, onRefresh }) {
  const navigate = useNavigate();
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");

  const candidate = application?.candidate;
  const email = candidate?.email;
  const phone = candidate?.phone;
  const linkedin = candidate?.linkedinUrl;
  const candidateId = candidate?.id;

  const handleEdit = (field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue ?? "");
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleSave = async () => {
    if (!candidateId) return;
    const fieldMap = {
      email: "email",
      phone: "phone",
      linkedin: "linkedinUrl",
    };
    try {
      await CandidatesService.updateCandidate(candidateId, {
        [fieldMap[editingField]]: editValue,
      });
      setEditingField(null);
      setEditValue("");
      onRefresh?.();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to save contact info",
        color: "red",
      });
    }
  };

  const rowProps = {
    editingField,
    editValue,
    onEdit: handleEdit,
    onEditChange: setEditValue,
    onSave: handleSave,
    onCancel: handleCancel,
  };

  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="md">
        <Text size="xs" fw={600} c="dimmed" tt="uppercase" lts={0.5}>
          Contact
        </Text>

        <Stack gap="sm">
          <ContactRow
            icon={IconMail}
            field="email"
            value={email}
            {...rowProps}
          />
          <ContactRow
            icon={IconPhone}
            field="phone"
            value={phone}
            {...rowProps}
          />
          <ContactRow
            icon={IconBrandLinkedin}
            field="linkedin"
            value={linkedin}
            href={
              linkedin
                ? `https://${linkedin.replace(/^https?:\/\//, "")}`
                : undefined
            }
            {...rowProps}
          />
        </Stack>

        {candidateId && (
          <Anchor
            size="sm"
            c="blue"
            style={{ cursor: "pointer" }}
            onClick={() =>
              navigate(ROUTES.CANDIDATE_DETAIL.replace(":id", candidateId))
            }
          >
            View full candidate profile &rarr;
          </Anchor>
        )}
      </Stack>
    </Card>
  );
}
