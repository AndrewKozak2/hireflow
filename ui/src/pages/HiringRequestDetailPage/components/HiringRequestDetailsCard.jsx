import {
  Anchor,
  Box,
  Card,
  Divider,
  Grid,
  Stack,
  Text,
  useMantineTheme,
} from "@mantine/core";

function formatEnumLabel(value) {
  if (!value) {
    return "—";
  }

  return String(value)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return value;
}

function formatUser(user) {
  if (!user) {
    return "—";
  }

  return user.name || user.email || "—";
}

function formatSalaryRange(request) {
  if (!request.salary_min && !request.salary_max) {
    return "—";
  }

  const currency = request.currency ?? "";
  const min = request.salary_min ? `${request.salary_min}` : "—";
  const max = request.salary_max ? `${request.salary_max}` : "—";

  return `${min} - ${max} ${currency}`.trim();
}

function DetailField({ label, value, span = 4, multiline = false }) {
  const theme = useMantineTheme();

  return (
    <Grid.Col span={{ base: 12, sm: Math.max(span, 6), lg: span }}>
      <Text size="sm" c={theme.colors.gray[6]} mb={4}>
        {label}
      </Text>
      <Text
        size="sm"
        fw={600}
        c={theme.colors.gray[9]}
        style={{ whiteSpace: multiline ? "pre-line" : "normal" }}
      >
        {formatValue(value)}
      </Text>
    </Grid.Col>
  );
}

function DetailSection({ title, children }) {
  return (
    <Box>
      <Text
        size="xs"
        fw={700}
        tt="uppercase"
        c="dimmed"
        style={{ letterSpacing: "0.06em" }}
        mb="md"
      >
        {title}
      </Text>
      <Grid gutter="lg">{children}</Grid>
    </Box>
  );
}

function AttachmentsField({ attachments }) {
  const normalizedAttachments = Array.isArray(attachments) ? attachments : [];

  if (!normalizedAttachments.length) {
    return <DetailField label="Attachments" value="—" span={12} />;
  }

  return (
    <Grid.Col span={12}>
      <Text size="sm" c="dimmed" mb={4}>
        Attachments
      </Text>
      <Stack gap={4}>
        {normalizedAttachments.map((attachment) => (
          <Anchor
            key={attachment}
            href={attachment}
            target="_blank"
            rel="noreferrer"
            size="sm"
          >
            {attachment}
          </Anchor>
        ))}
      </Stack>
    </Grid.Col>
  );
}

export function HiringRequestDetailsCard({ request, formatDate }) {
  const theme = useMantineTheme();

  return (
    <Card
      radius="lg"
      p="lg"
      style={{
        border: `1px solid ${theme.other.appColors.border}`,
        backgroundColor: theme.other.appColors.surface,
      }}
    >
      <Stack gap="xl">
        <DetailSection title="Position">
          <DetailField label="Job title" value={request.job_title} />
          <DetailField
            label="Department"
            value={formatEnumLabel(request.department)}
          />
          <DetailField
            label="Reason for opening"
            value={request.reason_for_opening}
            multiline
          />
          <DetailField
            label="Headcount"
            value={String(request.headcount ?? "—")}
          />
          <DetailField
            label="Priority"
            value={formatEnumLabel(request.priority)}
          />
        </DetailSection>

        <Divider />

        <DetailSection title="Level and language">
          <DetailField
            label="Expertise level"
            value={request.expertise_level}
          />
          <DetailField label="English level" value={request.english_level} />
        </DetailSection>

        <Divider />

        <DetailSection title="Candidate profile">
          <DetailField
            label="Required work experience"
            value={
              request.required_experience_years !== undefined &&
              request.required_experience_years !== null
                ? `${request.required_experience_years} years`
                : "—"
            }
          />
          <DetailField
            label="Past or potential positions"
            value={request.past_potential_positions}
            span={12}
            multiline
          />
          <DetailField
            label="Key requirements"
            value={request.key_requirements}
            span={12}
            multiline
          />
          <DetailField
            label="Certifications, trainings, courses"
            value={request.certifications_courses}
            span={12}
            multiline
          />
          <DetailField
            label="Desired personal qualities"
            value={request.desired_personal_qualities}
            span={12}
            multiline
          />
          <DetailField
            label="Unacceptable personal qualities"
            value={request.unacceptable_personal_qualities}
            span={12}
            multiline
          />
        </DetailSection>

        <Divider />

        <DetailSection title="Role and scope">
          <DetailField
            label="Role purpose"
            value={request.role_purpose}
            span={12}
            multiline
          />
          <DetailField
            label="Area of responsibility"
            value={request.area_of_responsibility}
            span={12}
            multiline
          />
          <DetailField
            label="First 90 days goals"
            value={request.first_90_days_goals}
            span={12}
            multiline
          />
          <DetailField
            label="Future responsibilities"
            value={request.future_responsibilities}
            span={12}
            multiline
          />
        </DetailSection>

        <Divider />

        <DetailSection title="Reporting structure">
          <DetailField
            label="Reports to"
            value={formatUser(request.reports_to)}
          />
          <DetailField
            label="Direct reports"
            value={request.direct_reports}
            span={12}
            multiline
          />
        </DetailSection>

        <Divider />

        <DetailSection title="Logistics">
          <DetailField
            label="Location"
            value={formatEnumLabel(request.location)}
          />
          <DetailField
            label="Employment type"
            value={formatEnumLabel(request.employment_type)}
          />
          <DetailField
            label="Target start date"
            value={formatDate(request.target_start_date)}
          />
          <DetailField label="Deadline" value={formatDate(request.deadline)} />
          <DetailField
            label="Salary range"
            value={formatSalaryRange(request)}
          />
        </DetailSection>

        <Divider />

        <DetailSection title="Attachments">
          <AttachmentsField attachments={request.attachments} />
        </DetailSection>
      </Stack>
    </Card>
  );
}
