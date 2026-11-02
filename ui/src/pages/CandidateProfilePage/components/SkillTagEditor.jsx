import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Pill,
  PillsInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { theme } from "../../../theming/theme";

export function SkillTagEditor({ skills, onSave, isSaving }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftSkills, setDraftSkills] = useState(skills);
  const [nextSkill, setNextSkill] = useState("");

  const addSkill = () => {
    const trimmed = nextSkill.trim();
    const lowerCasedSkills = draftSkills.map((skill) => skill.toLowerCase());

    if (!trimmed || lowerCasedSkills.includes(trimmed.toLowerCase())) {
      return;
    }

    setDraftSkills((current) => [...current, trimmed]);
    setNextSkill("");
  };

  if (!isEditing) {
    return (
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            Extracted skills
          </Text>
          <Button
            variant="subtle"
            size="compact-sm"
            px={0}
            color={theme.colors.blue[7]}
            fs={theme.fontSizes.xs}
            onClick={() => {
              setDraftSkills(skills);
              setNextSkill("");
              setIsEditing(true);
            }}
          >
            Edit
          </Button>
        </Group>

        {skills.length ? (
          <Group gap="xs">
            {skills.map((skill) => (
              <Badge
                key={skill}
                variant="white"
                radius="10px"
                tt="none"
                color={theme.colors.gray[7]}
                bg={theme.white}
                p="15px 9px"
                styles={{
                  root: {
                    border: `1px solid ${theme.colors.gray[2]}`,
                    lineHeight: 1.5,
                    fontWeight: 500,
                  },
                }}
              >
                {skill}
              </Badge>
            ))}
          </Group>
        ) : (
          <Text size="sm" c="dimmed">
            No skills extracted yet.
          </Text>
        )}
      </Stack>
    );
  }

  return (
    <Stack gap="sm">
      <TextInput
        value={nextSkill}
        onChange={(event) => setNextSkill(event.currentTarget.value)}
        placeholder="Add skill and press Enter"
        rightSectionPointerEvents="all"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            addSkill();
          }
        }}
        rightSection={
          <ActionIcon variant="subtle" color="indigo" onClick={addSkill}>
            <IconPlus size={14} />
          </ActionIcon>
        }
      />

      <PillsInput>
        <Pill.Group>
          {draftSkills.map((skill) => (
            <Pill
              key={skill}
              withRemoveButton
              onRemove={() =>
                setDraftSkills((current) =>
                  current.filter((item) => item !== skill),
                )
              }
            >
              {skill}
            </Pill>
          ))}
        </Pill.Group>
      </PillsInput>

      {!draftSkills.length ? (
        <Text size="sm" c="dimmed">
          No skills extracted yet.
        </Text>
      ) : null}

      <Group justify="flex-end">
        <Button
          variant="default"
          onClick={() => {
            setDraftSkills(skills);
            setNextSkill("");
            setIsEditing(false);
          }}
        >
          Cancel
        </Button>
        <Button
          loading={isSaving}
          onClick={async () => {
            const success = await onSave(draftSkills);
            if (success) {
              setIsEditing(false);
            }
          }}
        >
          Save
        </Button>
      </Group>
    </Stack>
  );
}
