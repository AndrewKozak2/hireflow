import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Stack,
  Group,
  Title,
  Alert,
  TextInput,
  Select,
  Paper,
  Text,
  Button,
  Anchor,
  Textarea,
  Box,
  ActionIcon,
  Tooltip,
  Loader,
  Center,
  NumberInput,
} from "@mantine/core";
import {
  IconInfoCircle,
  IconArrowLeft,
  IconBold,
  IconItalic,
  IconH2,
  IconH3,
  IconList,
} from "@tabler/icons-react";
import { useJobFormStore } from "../../stores/useJobFormStore";
import { JobsService } from "../../services/JobsService";
import { UsersService } from "../../services/UsersService";
import { useNotifications } from "../../hooks/useNotifications";
import { ROLES } from "../../constants/roles";
import {
  DEPARTMENTS,
  EXPERTISE_LEVELS,
  ENGLISH_LEVELS,
  CURRENCY_OPTIONS,
  LOCATION_OPTIONS,
} from "../../constants/hiringRequestConstants";
import { EMPLOYMENT_TYPE_OPTIONS, JOB_STATUSES } from "../../constants/job";
import { useDateTime } from "../../hooks/useDateTime";

function RichTextarea({
  label,
  placeholder,
  value,
  onChange,
  minRows = 4,
  hint,
  required,
}) {
  const applyFormat = (format) => {
    document.execCommand(format, false, null);
  };

  return (
    <Box>
      <Group justify="space-between" mb={6}>
        <Text component="label" size="sm" fw={500}>
          {label}
          {required && (
            <Text component="span" color="red" ml={4}>
              *
            </Text>
          )}
          {hint && (
            <Text component="span" size="sm" c="dimmed" fw={400} ml={4}>
              {hint}
            </Text>
          )}
        </Text>
      </Group>
      <Box
        style={(theme) => ({
          border: `0.5px solid ${theme.colors.gray[4]}`,
          borderRadius: theme.radius.sm,
          "&:focusWithin": {
            borderColor: theme.colors.indigo[5],
            boxShadow: `0 0 0 2px ${theme.colors.indigo[1]}`,
          },
        })}
      >
        <Group
          gap={2}
          px={8}
          py={6}
          style={(theme) => ({
            borderBottom: `0.5px solid ${theme.colors.gray[3]}`,
          })}
        >
          <Tooltip label="Bold" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => applyFormat("bold")}
            >
              <IconBold size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Italic" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => applyFormat("italic")}
            >
              <IconItalic size={14} />
            </ActionIcon>
          </Tooltip>
          <Text size="xs" c="gray.4" mx={2}>
            |
          </Text>
          <Tooltip label="Heading 2" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => applyFormat("heading2")}
            >
              <IconH2 size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Heading 3" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => applyFormat("heading3")}
            >
              <IconH3 size={14} />
            </ActionIcon>
          </Tooltip>
          <Text size="xs" c="gray.4" mx={2}>
            |
          </Text>
          <Tooltip label="Bullet list" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => applyFormat("insertUnorderedList")}
            >
              <IconList size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
        <Textarea
          variant="unstyled"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autosize
          minRows={minRows}
          px="sm"
          pb="sm"
          pt={6}
        />
      </Box>
    </Box>
  );
}

export default function JobCreationForm() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { formatRelativeDate } = useDateTime();
  const { onSuccess } = useNotifications();
  const prefill = location.state?.prefill ?? null;
  const isPrefilled = Boolean(prefill);
  const isEdit = Boolean(id);

  const {
    title,
    setTitle,
    hiringManager,
    setHiringManager,
    employmentType,
    setEmploymentType,
    jobLocation,
    setJobLocation,
    description,
    setDescription,
    requirements,
    setRequirements,
    niceToHave,
    setNiceToHave,
    saving,
    setSaving,
    submitting,
    setSubmitting,
    initializeForm,
    resetForm,
    department,
    setDepartment,
    headcount,
    setHeadcount,
    expertise_level,
    setExpertiseLevel,
    english_level,
    setEnglishLevel,
    salary_min,
    setSalaryMin,
    salary_max,
    setSalaryMax,
    currency,
    setCurrency,
  } = useJobFormStore();

  const [hiringManagers, setHiringManagers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    const fetchHiringManagers = async () => {
      try {
        const users = await UsersService.getUsers();
        const hms = users
          .filter((u) => u.role === ROLES.MANAGER)
          .map((u) => ({ value: u.id, label: u.name }));
        setHiringManagers(hms);
      } catch (err) {
        console.error("Failed to fetch hiring managers", err);
      }
    };

    fetchHiringManagers();
  }, []);

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      try {
        const job = await JobsService.getById(id);
        initializeForm({
          ...job,
          hiring_manager_id: job.hiringManagerId,
          employmentType: job.employmentType,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch job");
      } finally {
        setLoading(false);
      }
    };

    if (isEdit) {
      fetchJob();
    } else if (prefill) {
      initializeForm({
        ...prefill,
        hiringManager: prefill.hiring_manager_id,
      });
    } else {
      resetForm();
    }
  }, [id, prefill, initializeForm, resetForm, isEdit]);

  const getFormData = (status) => ({
    title,
    description,
    employmentType,
    location: jobLocation,
    requirements,
    niceToHave,
    hiringManagerId: hiringManager,
    hiringRequestId: prefill?.hiring_request_id,
    department,
    headcount,
    expertise_level,
    english_level,
    salary_min,
    salary_max,
    currency,
    status,
  });

  const validate = () => {
    if (!title?.trim()) return "Title is required.";
    if (!description?.trim())
      return "Description (About the role) is required.";
    if (!hiringManager) return "Hiring Manager is required.";
    return null;
  };

  const handleSaveDraft = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await JobsService.update(id, getFormData(JOB_STATUSES.DRAFT));
      } else {
        await JobsService.create(getFormData(JOB_STATUSES.DRAFT));
      }
      resetForm();
      navigate("/jobs");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit) {
        await JobsService.update(
          id,
          getFormData(JOB_STATUSES.PENDING_APPROVAL),
        );
        onSuccess({ message: "Job updated and submitted for approval" });
      } else {
        const response = await JobsService.create(
          getFormData(JOB_STATUSES.PENDING_APPROVAL),
        );
        const hiringManagerEmail = response?.hiringManager?.email;
        onSuccess({
          message: hiringManagerEmail
            ? `Sent to ${hiringManagerEmail} for approval`
            : "Job submitted for approval",
        });
      }
      resetForm();
      navigate("/jobs");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit job");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <Stack maw={720} mx="auto" p="xl" gap="lg">
      <Anchor
        component="button"
        size="sm"
        c="dimmed"
        underline="never"
        onClick={() => navigate(-1)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          width: "fit-content",
        }}
      >
        <IconArrowLeft size={14} />
        Back
      </Anchor>

      <Group justify="space-between" align="center">
        <Title order={2}>{isEdit ? "Edit Job" : "New Job"}</Title>
        <Group gap="sm">
          <Button
            variant="default"
            size="sm"
            loading={saving}
            onClick={handleSaveDraft}
          >
            Save as draft
          </Button>
          <Button
            size="sm"
            color="indigo"
            loading={submitting}
            onClick={handleSubmit}
          >
            Submit for approval
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert color="red" title="Error">
          {error}
        </Alert>
      )}

      {isPrefilled && (
        <Alert variant="light" color="blue" icon={<IconInfoCircle size={16} />}>
          Pre-filled from hiring request by{" "}
          <Anchor size="sm" fw={500}>
            {prefill.hiring_manager_name}
          </Anchor>
          {prefill.created_at &&
            ` · ${formatRelativeDate(prefill.created_at)}. All fields editable.`}
        </Alert>
      )}

      <Paper withBorder p="lg" radius="md">
        <Text fw={500} mb="md">
          Hiring Request Details
        </Text>
        <Stack gap="sm">
          <Group grow>
            <Select
              label="Department"
              placeholder="Select department..."
              data={DEPARTMENTS.map((d) => ({
                value: d.value,
                label: `${d.label}`,
              }))}
              value={department}
              onChange={setDepartment}
            />
            <NumberInput
              label="Headcount"
              placeholder="Enter headcount..."
              value={headcount}
              onChange={setHeadcount}
              min={1}
            />
          </Group>
          <Group grow>
            <Select
              label="Expertise Level"
              placeholder="Select expertise level..."
              data={EXPERTISE_LEVELS.map((l) => ({
                value: l.value,
                label: `${l.label} - ${l.description}`,
              }))}
              value={expertise_level}
              onChange={setExpertiseLevel}
            />
            <Select
              label="English Level"
              placeholder="Select English level..."
              data={ENGLISH_LEVELS.map((l) => ({
                value: l.value,
                label: `${l.label} - ${l.description}`,
              }))}
              value={english_level}
              onChange={setEnglishLevel}
            />
          </Group>
          <Group grow>
            <NumberInput
              label="Salary Min"
              placeholder="Enter salary min..."
              value={salary_min}
              onChange={setSalaryMin}
            />
            <NumberInput
              label="Salary Max"
              placeholder="Enter salary max..."
              value={salary_max}
              onChange={setSalaryMax}
            />
            <Select
              label="Currency"
              placeholder="Select currency..."
              data={CURRENCY_OPTIONS}
              value={currency}
              onChange={setCurrency}
            />
          </Group>
        </Stack>
      </Paper>

      <Paper withBorder p="lg" radius="md">
        <Text fw={500} mb="md">
          Basic info
        </Text>
        <Stack gap="md">
          <TextInput
            label="Title"
            placeholder="e.g. Senior Frontend Engineer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Group grow align="flex-start">
            <Select
              label="Hiring Manager"
              placeholder="Select manager"
              data={hiringManagers}
              value={hiringManager}
              onChange={setHiringManager}
              required
            />
            <Select
              label="Employment type"
              placeholder="Select employment type..."
              data={EMPLOYMENT_TYPE_OPTIONS}
              value={employmentType}
              onChange={setEmploymentType}
            />
          </Group>

          <Select
            label="Location"
            placeholder="Select location..."
            data={LOCATION_OPTIONS}
            value={jobLocation}
            onChange={setJobLocation}
            clearable
          />
        </Stack>
      </Paper>

      <Paper withBorder p="lg" radius="md">
        <Text fw={500} mb="md">
          Role details
        </Text>
        <Stack gap="md">
          <RichTextarea
            label="About the role"
            placeholder="Describe the role and what the person will work on…"
            value={description}
            required
            onChange={(e) => setDescription(e.target.value)}
            minRows={5}
          />

          <RichTextarea
            label="Requirements"
            placeholder="Key requirements for the role…"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            minRows={4}
          />

          <RichTextarea
            label="Nice to have"
            hint="optional"
            placeholder="Optional skills or background…"
            value={niceToHave}
            onChange={(e) => setNiceToHave(e.target.value)}
            minRows={3}
          />
        </Stack>
      </Paper>
    </Stack>
  );
}
