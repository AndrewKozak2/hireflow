import {
  Box,
  Button,
  Divider,
  Flex,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { DraftSaveStatus } from "../components/DraftSaveStatus";
import { DatePickerInput } from "@mantine/dates";
import {
  CURRENCY_OPTIONS,
  DEPARTMENTS,
  EMPLOYMENT_OPTIONS,
  ENGLISH_LEVELS,
  EXPERTISE_LEVELS,
  LOCATION_OPTIONS,
  PRIORITY_OPTIONS,
} from "../../../constants/hiringRequestConstants";
import { RadioCardList } from "../../../components/RadioCardList/RadioCardList";

function SectionTitle({ children }) {
  return (
    <>
      <Divider mt="xl" mb="xs" />
      <Title order={5} mb="sm">
        {children}
      </Title>
    </>
  );
}

export function HiringRequestForm({
  mode = "create",
  form,
  managers = [],
  today,
  // create-only
  user,
  onFormSubmit,
  onCancel,
  submitting = false,
  // edit-only
  onSubmit,
  onDiscard,
  saving = false,
  submitLabel = "Save changes",
  isSubmitDisabled = false,
  // draft-only
  onSaveDraft,
  savingDraft = false,
  saveStatus,
  lastSavedAt,
}) {
  const readOnly = mode === "view";

  const handleSubmit =
    mode === "create" || mode === "draft" ? onFormSubmit : onSubmit;

  return (
    <form onSubmit={handleSubmit}>
      {/* Submitter */}
      {mode === "create" && (
        <>
          <SectionTitle>Submitter</SectionTitle>
          <TextInput label="Email" value={user?.email ?? ""} readOnly mb="md" />
        </>
      )}

      {/* Position */}
      <SectionTitle>Position</SectionTitle>
      <Stack gap="md" mb="md">
        <TextInput
          label="Job title"
          placeholder="e.g. Senior Frontend Engineer"
          withAsterisk={!readOnly}
          readOnly={readOnly}
          {...form.getInputProps("job_title")}
        />
        <TextInput
          label="Reason for opening this position"
          placeholder="New project, replacement, growth, expansion..."
          withAsterisk={!readOnly}
          readOnly={readOnly}
          {...form.getInputProps("reason_for_opening")}
        />
        <Flex gap="md">
          <Select
            label="Department"
            placeholder="Select department"
            data={DEPARTMENTS}
            withAsterisk={!readOnly}
            disabled={readOnly}
            style={{ flex: 1 }}
            allowDeselect={false}
            {...form.getInputProps("department")}
          />
          <NumberInput
            label="Headcount"
            min={1}
            withAsterisk={!readOnly}
            disabled={readOnly}
            style={{ flex: 1 }}
            {...form.getInputProps("headcount")}
          />
        </Flex>
      </Stack>

      {/* Expertise */}
      <SectionTitle>Level of expertise</SectionTitle>
      <Box mb="md">
        <RadioCardList
          data={EXPERTISE_LEVELS}
          value={form.values.expertise_level}
          onChange={(val) =>
            !readOnly && form.setFieldValue("expertise_level", val)
          }
          error={form.errors.expertise_level}
          disabled={readOnly}
        />
      </Box>

      {/* English */}
      <SectionTitle>English proficiency</SectionTitle>
      <Box mb="md">
        <RadioCardList
          data={ENGLISH_LEVELS}
          value={form.values.english_level}
          onChange={(val) =>
            !readOnly && form.setFieldValue("english_level", val)
          }
          error={form.errors.english_level}
          disabled={readOnly}
        />
      </Box>

      {/* Candidate profile */}
      <SectionTitle>Candidate profile</SectionTitle>
      <Stack gap="md" mb="md">
        <NumberInput
          label="Required work experience (years)"
          min={0}
          disabled={readOnly}
          {...form.getInputProps("required_experience_years")}
        />
        <TextInput
          label="Past or potential positions"
          description="What positions has the candidate held or could potentially hold?"
          placeholder="e.g. Senior Engineer at SaaS company, Tech Lead at startup..."
          readOnly={readOnly}
          {...form.getInputProps("past_potential_positions")}
        />
        <Textarea
          label="Key requirements"
          description="Required knowledge, skills, abilities."
          placeholder="One per line..."
          required
          minRows={3}
          autosize
          readOnly={readOnly}
          {...form.getInputProps("key_requirements")}
        />
        <TextInput
          label="Certifications, trainings, courses"
          description="Required or preferred credentials."
          placeholder="e.g. AWS Certified Solutions Architect, PMP..."
          readOnly={readOnly}
          {...form.getInputProps("certifications_courses")}
        />
        <Textarea
          label="Desired personal qualities"
          minRows={2}
          autosize
          readOnly={readOnly}
          {...form.getInputProps("desired_personal_qualities")}
        />
        <Textarea
          label="Unacceptable personal qualities"
          minRows={2}
          autosize
          readOnly={readOnly}
          {...form.getInputProps("unacceptable_personal_qualities")}
        />
      </Stack>

      {/* Role & scope */}
      <SectionTitle>Role &amp; scope</SectionTitle>
      <Stack gap="md" mb="md">
        <TextInput
          label="Role purpose"
          description="Position's purpose and the employee's expected outcomes (1–2 sentences)."
          placeholder="e.g. Lead frontend architecture for the candidate experience surface..."
          withAsterisk={!readOnly}
          readOnly={readOnly}
          {...form.getInputProps("role_purpose")}
        />
        <Textarea
          label="Area of responsibility"
          description="The scope of results for which this position is accountable and can influence."
          minRows={3}
          autosize
          readOnly={readOnly}
          {...form.getInputProps("area_of_responsibility")}
        />
        <Textarea
          label="First-90-days goals"
          description="Tasks the employee will need to accomplish in the next three months."
          minRows={3}
          autosize
          readOnly={readOnly}
          {...form.getInputProps("first_90_days_goals")}
        />
        <Textarea
          label="Future responsibilities"
          description="Duties the employee will perform within their area of responsibility."
          minRows={3}
          autosize
          readOnly={readOnly}
          {...form.getInputProps("future_responsibilities")}
        />
      </Stack>

      {/* Reporting structure */}
      <SectionTitle>Reporting structure</SectionTitle>
      <Stack gap="md" mb="md">
        <Select
          label="Reports to"
          description="To whom will the future employee report?"
          placeholder="Select manager"
          data={managers}
          clearable
          searchable
          disabled={readOnly}
          {...form.getInputProps("reports_to_id")}
        />
        <Textarea
          label="Direct reports"
          description="Who will be under the supervision of the future employee?"
          placeholder="e.g. 3 frontend engineers, 1 designer (or 'none')"
          minRows={2}
          autosize
          readOnly={readOnly}
          {...form.getInputProps("direct_reports")}
        />
      </Stack>

      {/* Logistics */}
      <SectionTitle>Logistics</SectionTitle>
      <Stack gap="md" mb="md">
        <Flex gap="md">
          <Select
            label="Location"
            data={LOCATION_OPTIONS}
            disabled={readOnly}
            allowDeselect={false}
            style={{ flex: 1 }}
            {...form.getInputProps("location")}
          />
          <Select
            label="Employment type"
            data={EMPLOYMENT_OPTIONS}
            disabled={readOnly}
            allowDeselect={false}
            style={{ flex: 1 }}
            {...form.getInputProps("employment_type")}
          />
        </Flex>
        <DatePickerInput
          label="Target start date"
          placeholder="dd.mm.yyyy"
          valueFormat="DD.MM.YYYY"
          clearable={!readOnly}
          minDate={today}
          readOnly={readOnly}
          {...form.getInputProps("target_start_date")}
        />
        <Flex gap="md">
          <NumberInput
            label="Salary min"
            min={0}
            disabled={readOnly}
            style={{ flex: 1 }}
            {...form.getInputProps("salary_min")}
          />
          <NumberInput
            label="Salary max"
            min={0}
            disabled={readOnly}
            style={{ flex: 1 }}
            {...form.getInputProps("salary_max")}
          />
          <Select
            label="Currency"
            data={CURRENCY_OPTIONS}
            disabled={readOnly}
            allowDeselect={false}
            style={{ flex: 1 }}
            {...form.getInputProps("currency")}
          />
        </Flex>
        <Box>
          <Text size="sm" fw={500} mb={6}>
            Priority
          </Text>
          <SegmentedControl
            fullWidth
            data={PRIORITY_OPTIONS}
            disabled={readOnly}
            {...form.getInputProps("priority")}
          />
        </Box>
      </Stack>

      {/* Notes */}
      <SectionTitle>Notes</SectionTitle>
      <Stack gap="md" mb="xl">
        <Textarea
          label="Notes for the recruiter"
          placeholder="Anything else they should know?"
          minRows={3}
          autosize
          readOnly={readOnly}
          {...form.getInputProps("hm_notes_for_recruiter")}
        />
      </Stack>

      {/* Footer */}
      {mode === "create" && (
        <Flex justify="flex-end" gap="sm" pb="xl">
          <Button variant="default" onClick={onCancel}>
            Cancel
          </Button>
          {onSaveDraft && (
            <Button variant="light" onClick={onSaveDraft} loading={savingDraft}>
              Save as Draft
            </Button>
          )}
          <Button type="submit" loading={submitting}>
            Submit for review
          </Button>
        </Flex>
      )}
      {mode === "draft" && (
        <Flex justify="flex-end" align="center" gap="sm" pb="xl">
          <DraftSaveStatus status={saveStatus} lastSavedAt={lastSavedAt} />
          <Button variant="light" onClick={onSaveDraft} loading={savingDraft}>
            Save Draft
          </Button>
          <Button type="submit" loading={submitting}>
            Submit for review
          </Button>
        </Flex>
      )}
      {mode === "edit" && (
        <Flex justify="flex-end" gap="sm" pb="xl">
          <Button variant="default" onClick={onDiscard}>
            Discard
          </Button>
          <Button type="submit" loading={saving} disabled={isSubmitDisabled}>
            {submitLabel}
          </Button>
        </Flex>
      )}
    </form>
  );
}
