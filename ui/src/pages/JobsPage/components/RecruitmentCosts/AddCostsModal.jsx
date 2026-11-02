import { useState, useRef } from "react";
import {
  Modal,
  Stack,
  Group,
  Button,
  Select,
  TextInput,
  NumberInput,
  Textarea,
  ActionIcon,
  Text,
  Alert,
  Divider,
  Box,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconPlus, IconTrash, IconInfoCircle } from "@tabler/icons-react";
import { RecruitmentCostsService } from "../../../../services/RecruitmentCostsService";
import { SOURCE_META } from "../../../../constants/application";

const MANUAL_CATEGORY_OPTIONS = [
  { value: "JOB_POSTING", label: "Job Posting" },
  { value: "SOURCE_SUCCESS_FEE", label: "Source Success Fee" },
  { value: "INTERVIEW_PAYMENT", label: "Interview Payment" },
  { value: "OTHER", label: "Other Expense" },
];

const JOB_POSTING_SOURCE_OPTIONS = [
  { value: "djinni", label: "Djinni" },
  { value: "dou", label: "DOU" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "work.ua", label: "Work.ua" },
  { value: "other", label: "Other" },
];

function createEmptyRow() {
  return {
    category: "",
    source: "",
    customSource: "",
    applicationId: "",
    title: "",
    amount: "",
    incurredAt: new Date(),
    description: "",
  };
}

function buildCandidateOptions(applications) {
  return applications.map((app) => {
    const name =
      [app.candidate?.firstName, app.candidate?.lastName]
        .filter(Boolean)
        .join(" ") || `Application ${app.id.slice(0, 8)}`;
    return { value: app.id, label: name };
  });
}

function getAppSourceLabel(applicationId, applications) {
  const app = applications.find((a) => a.id === applicationId);
  if (!app?.source) return null;
  const meta = SOURCE_META[app.source.toLowerCase()];
  return meta ? meta.label : app.source;
}

function validateRows(rows) {
  return rows.map((row) => {
    const errors = {};

    if (!row.category) errors.category = "Category is required";
    if (!row.title?.trim()) errors.title = "Title is required";

    if (row.amount === "" || row.amount === null || row.amount === undefined) {
      errors.amount = "Amount is required";
    } else if (Number(row.amount) < 0) {
      errors.amount = "Amount cannot be negative";
    }

    if (!row.incurredAt) errors.incurredAt = "Date is required";

    if (row.category === "JOB_POSTING") {
      if (!row.source) {
        errors.source = "Source is required for Job Posting";
      } else if (row.source === "other" && !row.customSource?.trim()) {
        errors.customSource = "Please specify the source";
      }
    }

    if (
      row.category === "SOURCE_SUCCESS_FEE" ||
      row.category === "INTERVIEW_PAYMENT"
    ) {
      if (!row.applicationId) errors.applicationId = "Candidate is required";
    }

    return errors;
  });
}

function hasAnyErrors(errorList) {
  return errorList.some((e) => Object.keys(e).length > 0);
}

export function AddCostsModal({
  opened,
  onClose,
  jobId,
  applications,
  onSuccess,
}) {
  const [rows, setRows] = useState([createEmptyRow()]);
  const [rowErrors, setRowErrors] = useState([{}]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const scrollEndRef = useRef(null);

  const candidateOptions = buildCandidateOptions(applications);

  const resetForm = () => {
    setRows([createEmptyRow()]);
    setRowErrors([{}]);
    setRequestError(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const updateRow = (index, field, value) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const updated = { ...row, [field]: value };
        if (field === "category") {
          updated.source = "";
          updated.customSource = "";
          updated.applicationId = "";
        }
        return updated;
      }),
    );
    setRowErrors((prev) =>
      prev.map((e, i) => {
        if (i !== index) return e;
        if (field === "category") return {};
        const next = { ...e };
        delete next[field];
        return next;
      }),
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
    setRowErrors((prev) => [...prev, {}]);
    setTimeout(() => {
      scrollEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 50);
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
    setRowErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const errors = validateRows(rows);
    setRowErrors(errors);
    if (hasAnyErrors(errors)) return;

    setIsSubmitting(true);
    setRequestError(null);

    try {
      const costs = rows.map((row) => {
        const item = {
          jobId,
          category: row.category,
          title: row.title.trim(),
          amount: Number(row.amount),
          currency: "USD",
          incurredAt:
            row.incurredAt instanceof Date
              ? row.incurredAt.toISOString().split("T")[0]
              : row.incurredAt,
          description: row.description?.trim() || null,
        };

        if (row.category === "JOB_POSTING") {
          item.source =
            row.source === "other" ? row.customSource.trim() : row.source;
        } else if (row.category === "SOURCE_SUCCESS_FEE") {
          item.applicationId = row.applicationId;
        } else if (row.category === "INTERVIEW_PAYMENT") {
          item.applicationId = row.applicationId;
        } else if (row.category === "OTHER") {
          if (row.applicationId) item.applicationId = row.applicationId;
          if (row.source?.trim()) item.source = row.source.trim();
        }

        return item;
      });

      await RecruitmentCostsService.create(jobId, costs);
      resetForm();
      onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.message;
      setRequestError(
        Array.isArray(msg)
          ? msg.join(", ")
          : msg || "Failed to add costs. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text fw={700} size="lg">
          Add Recruitment Costs
        </Text>
      }
      size="xl"
      radius="md"
      centered
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <Stack gap="md">
        {requestError && (
          <Alert
            color="red"
            icon={<IconInfoCircle size={16} />}
            variant="light"
            radius="md"
          >
            {requestError}
          </Alert>
        )}

        <Stack gap="lg">
          {rows.map((row, index) => (
            <CostRow
              key={index}
              index={index}
              row={row}
              errors={rowErrors[index] || {}}
              onChange={updateRow}
              onRemove={rows.length > 1 ? () => removeRow(index) : null}
              candidateOptions={candidateOptions}
              applications={applications}
            />
          ))}
          <div ref={scrollEndRef} />
        </Stack>

        <Button
          variant="subtle"
          leftSection={<IconPlus size={14} />}
          onClick={addRow}
          size="sm"
          disabled={isSubmitting}
        >
          Add another expense
        </Button>

        <Divider />

        <Group justify="flex-end">
          <Button
            variant="default"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting}>
            Submit {rows.length > 1 ? `${rows.length} costs` : "cost"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function CostRow({
  index,
  row,
  errors,
  onChange,
  onRemove,
  candidateOptions,
  applications,
}) {
  const showSourceSelect = row.category === "JOB_POSTING";
  const showCustomSource =
    row.category === "JOB_POSTING" && row.source === "other";
  const showCandidateSelect = [
    "SOURCE_SUCCESS_FEE",
    "INTERVIEW_PAYMENT",
    "OTHER",
  ].includes(row.category);
  const showCandidateSourceReadOnly =
    row.category === "SOURCE_SUCCESS_FEE" && !!row.applicationId;
  const showSourceFreeText = row.category === "OTHER";
  const candidateRequired =
    row.category === "SOURCE_SUCCESS_FEE" ||
    row.category === "INTERVIEW_PAYMENT";

  const appSourceLabel = showCandidateSourceReadOnly
    ? getAppSourceLabel(row.applicationId, applications)
    : null;

  return (
    <Box p="md" b="1px solid var(--mantine-color-gray-3)" bdr="md">
      <Group justify="space-between" mb="sm">
        <Text size="sm" fw={600} c="dimmed">
          Expense {index + 1}
        </Text>
        {onRemove && (
          <ActionIcon color="red" variant="subtle" size="sm" onClick={onRemove}>
            <IconTrash size={14} />
          </ActionIcon>
        )}
      </Group>

      <Stack gap="sm">
        <Select
          label="Category"
          placeholder="Select category"
          data={MANUAL_CATEGORY_OPTIONS}
          value={row.category || null}
          onChange={(value) => onChange(index, "category", value || "")}
          error={errors.category}
          withAsterisk
        />

        <TextInput
          label="Title"
          placeholder="e.g. Technical interview fee"
          value={row.title}
          onChange={(e) => onChange(index, "title", e.currentTarget.value)}
          error={errors.title}
          withAsterisk
        />

        <Group grow>
          <NumberInput
            label="Amount (USD)"
            placeholder="e.g. 100"
            value={row.amount}
            onChange={(value) => onChange(index, "amount", value)}
            error={errors.amount}
            min={0}
            allowNegative={false}
            thousandSeparator=","
            withAsterisk
          />
          <DateInput
            label="Date"
            placeholder="Pick date"
            value={row.incurredAt}
            onChange={(value) => onChange(index, "incurredAt", value)}
            error={errors.incurredAt}
            withAsterisk
            clearable
          />
        </Group>

        {showSourceSelect && (
          <Select
            label="Source"
            placeholder="Select source"
            data={JOB_POSTING_SOURCE_OPTIONS}
            value={row.source || null}
            onChange={(value) => onChange(index, "source", value || "")}
            error={errors.source}
            withAsterisk
          />
        )}

        {showCustomSource && (
          <TextInput
            label="Custom Source"
            placeholder="Specify source name"
            value={row.customSource}
            onChange={(e) =>
              onChange(index, "customSource", e.currentTarget.value)
            }
            error={errors.customSource}
            withAsterisk
          />
        )}

        {showCandidateSelect && (
          <Select
            label="Candidate"
            placeholder="Select candidate"
            data={candidateOptions}
            value={row.applicationId || null}
            onChange={(value) => onChange(index, "applicationId", value || "")}
            error={errors.applicationId}
            withAsterisk={candidateRequired}
            searchable
            nothingFoundMessage="No applications found"
          />
        )}

        {showCandidateSourceReadOnly && (
          <TextInput
            label="Source (from candidate)"
            value={appSourceLabel || "—"}
            readOnly
            description="Set automatically from the selected candidate's application source"
          />
        )}

        {showSourceFreeText && (
          <TextInput
            label="Source (optional)"
            placeholder="e.g. agency name"
            value={row.source}
            onChange={(e) => onChange(index, "source", e.currentTarget.value)}
          />
        )}

        <Textarea
          label="Description (optional)"
          placeholder="Add notes..."
          value={row.description}
          onChange={(e) =>
            onChange(index, "description", e.currentTarget.value)
          }
          rows={2}
          autosize
          minRows={2}
          maxRows={4}
        />
      </Stack>
    </Box>
  );
}
