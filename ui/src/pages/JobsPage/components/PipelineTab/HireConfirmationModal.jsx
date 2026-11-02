import { useState } from "react";
import {
  Modal,
  Stack,
  NumberInput,
  Text,
  Group,
  Button,
  Divider,
  Box,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { ApplicationsService } from "../../../../services/ApplicationsService";
import { formatUSD } from "../../../../utils/currencyFormatters";

export function HireConfirmationModal({
  opened,
  onClose,
  application,
  onSuccess,
  onRefreshCosts,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isReferral = application?.source === "referral";

  const form = useForm({
    initialValues: {
      actualMonthlySalary: "",
      commissionPercent: "",
      referralBonus: "",
    },
    validate: {
      actualMonthlySalary: (value) => {
        if (value === "" || value === null || value === undefined) {
          return "Monthly salary is required";
        }
        if (Number(value) <= 0) {
          return "Monthly salary must be greater than 0";
        }
        return null;
      },
      commissionPercent: (value) => {
        if (value === "" || value === null || value === undefined) {
          return "Commission percentage is required";
        }
        if (Number(value) < 0) {
          return "Commission percentage cannot be negative";
        }
        return null;
      },
      referralBonus: (value) => {
        if (!isReferral) return null;
        if (
          value !== "" &&
          value !== null &&
          value !== undefined &&
          Number(value) < 0
        ) {
          return "Referral bonus cannot be negative";
        }
        return null;
      },
    },
  });

  const salary = Number(form.values.actualMonthlySalary) || 0;
  const commission = Number(form.values.commissionPercent) || 0;
  const commissionPreview =
    salary > 0 && commission >= 0 ? (salary * commission) / 100 : null;

  const handleClose = () => {
    if (isSubmitting) return;
    form.reset();
    onClose();
  };

  const handleSubmit = async () => {
    const { hasErrors } = form.validate();
    if (hasErrors) return;

    setIsSubmitting(true);
    try {
      const payload = {
        actualMonthlySalary: Number(form.values.actualMonthlySalary),
        currency: "USD",
        commissionPercent: Number(form.values.commissionPercent),
        ...(isReferral && form.values.referralBonus !== ""
          ? { referralBonus: Number(form.values.referralBonus) }
          : {}),
      };

      await ApplicationsService.hireApplication(application.id, payload);

      const candidateName = [
        application.candidate?.firstName,
        application.candidate?.lastName,
      ]
        .filter(Boolean)
        .join(" ");

      notifications.show({
        title: "🎉 Candidate Hired!",
        message: `${candidateName} has been successfully hired${application.job?.title ? ` as ${application.job.title}` : ""}.`,
        color: "green",
        autoClose: 5000,
      });

      form.reset();
      onSuccess?.();
      onRefreshCosts?.();
    } catch (err) {
      notifications.show({
        title: "Error",
        message:
          err?.response?.data?.message ||
          "Failed to complete the hire. Please try again.",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const candidateName = application
    ? [application.candidate?.firstName, application.candidate?.lastName]
        .filter(Boolean)
        .join(" ") || "this candidate"
    : "this candidate";

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text fw={700} size="lg">
          Hire {candidateName}
        </Text>
      }
      centered
      radius="md"
      size="md"
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
      onExitTransitionEnd={() => form.reset()}
      styles={{
        header: { padding: "20px 20px 0" },
        body: { padding: "20px" },
      }}
    >
      <Stack gap="md">
        <NumberInput
          id="hire-modal-salary"
          label="Actual Monthly Salary (USD)"
          description="Gross monthly salary agreed upon"
          placeholder="e.g. 3000"
          min={1}
          allowNegative={false}
          allowDecimal={false}
          thousandSeparator=","
          withAsterisk
          {...form.getInputProps("actualMonthlySalary")}
        />

        <NumberInput
          id="hire-modal-commission"
          label="Recruiter Commission (%)"
          description="Percentage of monthly salary"
          placeholder="e.g. 10"
          min={0}
          max={100}
          allowNegative={false}
          suffix="%"
          withAsterisk
          {...form.getInputProps("commissionPercent")}
        />

        <Box
          p="sm"
          style={{
            border: "1px solid var(--mantine-color-gray-3)",
            borderRadius: "var(--mantine-radius-sm)",
            backgroundColor: "var(--mantine-color-gray-0)",
          }}
        >
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Recruiter Commission Preview
            </Text>
            <Text
              size="sm"
              fw={600}
              c={commissionPreview != null ? "blue" : "dimmed"}
            >
              {commissionPreview != null ? formatUSD(commissionPreview) : "—"}
            </Text>
          </Group>
        </Box>

        {isReferral && (
          <>
            <Divider />
            <NumberInput
              id="hire-modal-referral-bonus"
              label="Referral Bonus"
              description="One-time referral bonus for the referring person"
              placeholder="e.g. 500"
              min={0}
              allowNegative={false}
              thousandSeparator=","
              {...form.getInputProps("referralBonus")}
            />
          </>
        )}

        <Divider />

        <Group justify="flex-end">
          <Button
            id="hire-modal-cancel"
            variant="default"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            id="hire-modal-confirm"
            color="green"
            onClick={handleSubmit}
            loading={isSubmitting}
          >
            Confirm Hire
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
