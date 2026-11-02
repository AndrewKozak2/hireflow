import { useState } from "react";
import {
  Modal,
  Stack,
  Group,
  Button,
  Select,
  TextInput,
  NumberInput,
  Textarea,
  Text,
  Alert,
  Divider,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconInfoCircle } from "@tabler/icons-react";
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

const KNOWN_SOURCES = ["djinni", "dou", "linkedin", "work.ua"];

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

function costToFormState(cost) {
  const isKnownSource =
    cost.source && KNOWN_SOURCES.includes(cost.source.toLowerCase());
  return {
    category: cost.category || "",
    source:
      cost.category === "JOB_POSTING"
        ? isKnownSource
          ? cost.source.toLowerCase()
          : cost.source
            ? "other"
            : ""
        : cost.source || "",
    customSource:
      cost.category === "JOB_POSTING" && !isKnownSource
        ? cost.source || ""
        : "",
    applicationId: cost.applicationId || "",
    title: cost.title || "",
    amount: cost.amount != null ? Number(cost.amount) : "",
    incurredAt: cost.incurredAt ? new Date(cost.incurredAt) : new Date(),
    description: cost.description || "",
  };
}

function validate(fields) {
  const errors = {};

  if (!fields.category) errors.category = "Category is required";
  if (!fields.title?.trim()) errors.title = "Title is required";

  if (
    fields.amount === "" ||
    fields.amount === null ||
    fields.amount === undefined
  ) {
    errors.amount = "Amount is required";
  } else if (Number(fields.amount) < 0) {
    errors.amount = "Amount cannot be negative";
  }

  if (!fields.incurredAt) errors.incurredAt = "Date is required";

  if (fields.category === "JOB_POSTING") {
    if (!fields.source) {
      errors.source = "Source is required for Job Posting";
    } else if (fields.source === "other" && !fields.customSource?.trim()) {
      errors.customSource = "Please specify the source";
    }
  }

  if (
    fields.category === "SOURCE_SUCCESS_FEE" ||
    fields.category === "INTERVIEW_PAYMENT"
  ) {
    if (!fields.applicationId) errors.applicationId = "Candidate is required";
  }

  return errors;
}

export function EditCostModal({
  opened,
  onClose,
  cost,
  applications,
  onSuccess,
}) {
  const [fields, setFields] = useState(() => costToFormState(cost));
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState(null);

  const candidateOptions = buildCandidateOptions(applications);

  const update = (field, value) => {
    setFields((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "category") {
        updated.source = "";
        updated.customSource = "";
        updated.applicationId = "";
      }
      return updated;
    });
    setErrors((prev) => {
      if (field === "category") return {};
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    const validationErrors = validate(fields);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setRequestError(null);

    try {
      const payload = {
        category: fields.category,
        title: fields.title.trim(),
        amount: Number(fields.amount),
        currency: "USD",
        incurredAt:
          fields.incurredAt instanceof Date
            ? fields.incurredAt.toISOString().split("T")[0]
            : fields.incurredAt,
        description: fields.description?.trim() || null,
      };

      if (fields.category === "JOB_POSTING") {
        payload.source =
          fields.source === "other"
            ? fields.customSource.trim()
            : fields.source;
      } else if (
        fields.category === "SOURCE_SUCCESS_FEE" ||
        fields.category === "INTERVIEW_PAYMENT"
      ) {
        payload.applicationId = fields.applicationId;
      } else if (fields.category === "OTHER") {
        if (fields.applicationId) payload.applicationId = fields.applicationId;
        payload.source = fields.source?.trim() || null;
      }

      await RecruitmentCostsService.update(cost.id, payload);
      onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.message;
      setRequestError(
        Array.isArray(msg)
          ? msg.join(", ")
          : msg || "Failed to update cost. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const showSourceSelect = fields.category === "JOB_POSTING";
  const showCustomSource =
    fields.category === "JOB_POSTING" && fields.source === "other";
  const showCandidateSelect = [
    "SOURCE_SUCCESS_FEE",
    "INTERVIEW_PAYMENT",
    "OTHER",
  ].includes(fields.category);
  const showCandidateSourceReadOnly =
    fields.category === "SOURCE_SUCCESS_FEE" && !!fields.applicationId;
  const showSourceFreeText = fields.category === "OTHER";
  const candidateRequired =
    fields.category === "SOURCE_SUCCESS_FEE" ||
    fields.category === "INTERVIEW_PAYMENT";

  const appSourceLabel = showCandidateSourceReadOnly
    ? getAppSourceLabel(fields.applicationId, applications)
    : null;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text fw={700} size="lg">
          Edit Cost
        </Text>
      }
      size="lg"
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

        <Select
          label="Category"
          placeholder="Select category"
          data={MANUAL_CATEGORY_OPTIONS}
          value={fields.category || null}
          onChange={(value) => update("category", value || "")}
          error={errors.category}
          withAsterisk
        />

        <TextInput
          label="Title"
          placeholder="e.g. Technical interview fee"
          value={fields.title}
          onChange={(e) => update("title", e.currentTarget.value)}
          error={errors.title}
          withAsterisk
        />

        <Group grow>
          <NumberInput
            label="Amount (USD)"
            placeholder="e.g. 100"
            value={fields.amount}
            onChange={(value) => update("amount", value)}
            error={errors.amount}
            min={0}
            allowNegative={false}
            thousandSeparator=","
            withAsterisk
          />
          <DateInput
            label="Date"
            placeholder="Pick date"
            value={fields.incurredAt}
            onChange={(value) => update("incurredAt", value)}
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
            value={fields.source || null}
            onChange={(value) => update("source", value || "")}
            error={errors.source}
            withAsterisk
          />
        )}

        {showCustomSource && (
          <TextInput
            label="Custom Source"
            placeholder="Specify source name"
            value={fields.customSource}
            onChange={(e) => update("customSource", e.currentTarget.value)}
            error={errors.customSource}
            withAsterisk
          />
        )}

        {showCandidateSelect && (
          <Select
            label="Candidate"
            placeholder="Select candidate"
            data={candidateOptions}
            value={fields.applicationId || null}
            onChange={(value) => update("applicationId", value || "")}
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
            value={fields.source}
            onChange={(e) => update("source", e.currentTarget.value)}
          />
        )}

        <Textarea
          label="Description (optional)"
          placeholder="Add notes..."
          value={fields.description}
          onChange={(e) => update("description", e.currentTarget.value)}
          autosize
          minRows={2}
          maxRows={4}
        />

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
            Save changes
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
