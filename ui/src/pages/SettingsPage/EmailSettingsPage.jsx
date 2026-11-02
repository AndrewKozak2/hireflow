import { useState, useEffect, useCallback } from "react";
import { useDisclosure } from "@mantine/hooks";
import {
  Box,
  Button,
  Paper,
  Stack,
  Text,
  Title,
  Modal,
  Group,
  Select,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { SourceRulesTable } from "./components/SourceRulesTable";
import { ManageSourceRuleModal } from "./components/ManageSourceRuleModal";
import { EmailSettingsService } from "../../services/EmailSettingsService";

export function EmailSettingsPage() {
  const [opened, { open, close }] = useDisclosure(false);
  const [editingRule, setEditingRule] = useState(null);
  const [rules, setRules] = useState([]);
  const [provider, setProvider] = useState("brevo");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProvider, setIsSavingProvider] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);

  const fetchRules = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await EmailSettingsService.getEmailRules();
      const rulesData = response?.data ?? response;
      setRules(Array.isArray(rulesData) ? rulesData : []);
    } catch (error) {
      console.error("Error fetching rules:", error);
      notifications.show({
        title: "Error",
        message: "Failed to fetch source detection rules.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProvider = useCallback(async () => {
    try {
      const response = await EmailSettingsService.getEmailProvider();
      const nextProvider =
        response?.provider || response?.data?.provider || "brevo";
      setProvider(nextProvider);
    } catch (error) {
      console.error("Error fetching provider:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load the active email provider.",
        color: "red",
      });
    }
  }, []);

  useEffect(() => {
    const initFetch = async () => {
      setIsLoading(true);
      try {
        const [rulesRes, providerRes] = await Promise.all([
          EmailSettingsService.getEmailRules(),
          EmailSettingsService.getEmailProvider(),
        ]);

        const rulesData = rulesRes?.data ?? rulesRes;
        setRules(Array.isArray(rulesData) ? rulesData : []);

        const nextProvider =
          providerRes?.provider || providerRes?.data?.provider || "brevo";
        setProvider(nextProvider);
      } catch (error) {
        console.error("Initialization fetch failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initFetch();
  }, []);

  const handleAddClick = () => {
    setEditingRule(null);
    open();
  };

  const handleEditClick = (rule) => {
    setEditingRule(rule);
    open();
  };

  const handleSaveRule = async (values) => {
    const isEditing = !!editingRule;
    try {
      if (isEditing) {
        await EmailSettingsService.updateEmailRule(editingRule.id, values);
      } else {
        await EmailSettingsService.createEmailRule(values);
      }

      notifications.show({
        title: "Success",
        message: `Rule has been ${isEditing ? "updated" : "saved"} successfully.`,
        color: "green",
      });
      await fetchRules();
    } catch (error) {
      console.error("Error saving rule:", error);
      notifications.show({
        title: "Operation failed",
        message:
          error.response?.data?.message ||
          `Could not ${isEditing ? "update" : "save"} the rule.`,
        color: "red",
      });
      throw error;
    }
  };

  const handleProviderChange = async (value) => {
    const nextProvider = value || "brevo";
    setProvider(nextProvider);
    setIsSavingProvider(true);

    try {
      await EmailSettingsService.updateEmailProvider({
        provider: nextProvider,
      });
      notifications.show({
        title: "Success",
        message: "Email provider updated successfully.",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Provider update failed",
        message:
          error.response?.data?.message ||
          "Could not update the email provider.",
        color: "red",
      });
      await fetchProvider();
    } finally {
      setIsSavingProvider(false);
    }
  };

  const handleDeleteClick = (id) => {
    setRuleToDelete(id);
  };

  const confirmDelete = async () => {
    if (!ruleToDelete) return;
    try {
      await EmailSettingsService.deleteEmailRule(ruleToDelete);
      notifications.show({
        title: "Success",
        message: "Rule deleted successfully.",
        color: "green",
      });
      await fetchRules();
    } catch (error) {
      notifications.show({
        title: "Deletion failed",
        message: error.response?.data?.message || "Could not delete the rule.",
        color: "red",
      });
    } finally {
      setRuleToDelete(null);
    }
  };

  return (
    <Stack gap="lg">
      <Box mb="sm">
        <Title order={2} size="h2">
          Email Settings
        </Title>
        <Text c="dimmed" size="sm" mt="xs">
          Configure your incoming and outgoing email providers.
        </Text>
      </Box>

      <Paper radius="md" p="xl" withBorder>
        <Stack gap="lg">
          <Box>
            <Text fw={600} size="sm">
              Active Provider
            </Text>
            <Select
              data={[
                { value: "brevo", label: "Brevo" },
                { value: "resend", label: "Resend" },
              ]}
              value={provider}
              onChange={handleProviderChange}
              mt="xs"
              style={{ maxWidth: 300 }}
              allowDeselect={false}
              disabled={isSavingProvider}
            />
            <Text c="dimmed" size="xs" mt="xs">
              {"API keys remain in env vars."}
            </Text>
          </Box>
        </Stack>
      </Paper>

      <Paper radius="md" p="xl" withBorder>
        <Box mb="lg">
          <Text fw={600} size="md">
            Source detection rules
          </Text>
        </Box>
        <SourceRulesTable
          data={rules}
          isLoading={isLoading}
          onDeleteClick={handleDeleteClick}
          onEditClick={handleEditClick}
          onAddClick={handleAddClick}
        />
      </Paper>

      <ManageSourceRuleModal
        key={editingRule?.id ?? "new"}
        opened={opened}
        onClose={close}
        onSubmit={handleSaveRule}
        initialData={editingRule}
      />

      <Modal
        opened={!!ruleToDelete}
        onClose={() => setRuleToDelete(null)}
        title="Delete source rule"
        centered
      >
        <Text size="sm" mb="xl">
          Are you sure you want to delete this rule? This action cannot be
          undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setRuleToDelete(null)}>
            Cancel
          </Button>
          <Button color="red" onClick={confirmDelete}>
            Delete rule
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}
