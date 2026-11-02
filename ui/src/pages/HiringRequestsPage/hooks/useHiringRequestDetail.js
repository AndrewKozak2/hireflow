import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "@mantine/form";
import { HiringRequestsService } from "../../../services/HiringRequestsService";
import { useNotifications } from "../../../hooks/useNotifications";
import { ROUTES } from "../../../routes/routes";
import {
  HIRING_REQUEST_FORM_VALIDATE,
  HIRING_REQUEST_INITIAL_VALUES,
  requestToFormValues,
} from "../form/formConfig";
import { useHiringRequestFormState } from "./useHiringRequestFormState";
import { useDateTime } from "../../../hooks/useDateTime";
import { HiringRequestStatus } from "../../../constants/hiringRequestConstants";

const STATUS_STEP = { pending: 0, in_review: 1, approved: 2, rejected: 2 };

export function useHiringRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { onSuccess, onError } = useNotifications();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [submittingDraft, setSubmittingDraft] = useState(false);

  const { managers, today } = useHiringRequestFormState();

  const { toISO } = useDateTime();

  const form = useForm({
    initialValues: HIRING_REQUEST_INITIAL_VALUES,
    validate: HIRING_REQUEST_FORM_VALIDATE,
  });

  useEffect(() => {
    HiringRequestsService.getHiringRequestById(id)
      .then((data) => {
        const formValues = requestToFormValues(data);
        setRequest(data);
        form.setValues(formValues);
        form.resetDirty(formValues);
      })
      .catch(() => onError({ message: "Failed to load request" }))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpdate = async (values) => {
    setSaving(true);
    try {
      const updated = await HiringRequestsService.updateHiringRequest(id, {
        ...values,
        target_start_date: values.target_start_date
          ? toISO(values.target_start_date)
          : undefined,
      });
      const formValues = requestToFormValues(updated);
      setRequest(updated);
      form.setValues(formValues);
      form.resetDirty(formValues);
      setEditing(false);
      onSuccess({ message: "Request updated" });
    } catch {
      onError({ message: "Failed to update request" });
    } finally {
      setSaving(false);
    }
  };

  const handleResubmit = async (values) => {
    setResubmitting(true);
    try {
      const updated = await HiringRequestsService.resubmitHiringRequest(id, {
        ...values,
        target_start_date: values.target_start_date
          ? toISO(values.target_start_date)
          : undefined,
      });
      const formValues = requestToFormValues(updated);

      setRequest(updated);
      form.setValues(formValues);
      form.resetDirty(formValues);
      setEditing(false);
      onSuccess({ message: "Request resubmitted" });
    } catch {
      onError({ message: "Failed to resubmit request" });
    } finally {
      setResubmitting(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await HiringRequestsService.cancelHiringRequest(id);
      setRequest((prev) => ({
        ...prev,
        status: HiringRequestStatus.CANCELLED,
      }));
      setEditing(false);
      onSuccess({ message: "Request cancelled" });
    } catch {
      onError({ message: "Failed to cancel request" });
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitDraft = async () => {
    const { hasErrors } = form.validate();
    if (hasErrors) {
      onError({
        title: "Cannot submit",
        message:
          "Please complete all required fields before submitting — click Edit Draft to fill them in.",
      });
      return;
    }
    setSubmittingDraft(true);
    try {
      const {
        // eslint-disable-next-line no-unused-vars
        submitter_email: _email,
        target_start_date,
        ...rest
      } = form.values;
      const payload = {
        ...rest,
        ...(target_start_date
          ? { target_start_date: toISO(target_start_date) }
          : {}),
      };
      await HiringRequestsService.submitDraft(id, payload);
      onSuccess({ message: "Your request has been submitted" });
      navigate(ROUTES.HIRING_REQUESTS);
    } catch {
      onError({
        title: "Cannot submit",
        message:
          "Please complete all required fields before submitting — click Edit Draft to fill them in.",
      });
    } finally {
      setSubmittingDraft(false);
    }
  };

  const discardEdit = () => {
    const formValues = requestToFormValues(request);
    form.setValues(formValues);
    form.resetDirty(formValues);
    setEditing(false);
  };

  const handleValidationFailure = () => {
    onError({
      title: "Check the form",
      message: "Please fill in all required fields correctly",
    });
  };

  const onSubmit = form.onSubmit(handleUpdate, handleValidationFailure);
  const onResubmit = form.onSubmit(handleResubmit, handleValidationFailure);

  const goBack = () => navigate(ROUTES.HIRING_REQUESTS);
  const goToJob = (jobId) => navigate(ROUTES.JOB_DETAIL.replace(":id", jobId));

  const isDraft = request?.status === HiringRequestStatus.DRAFT;
  const isPending = request?.status === HiringRequestStatus.PENDING;
  const isApproved = request?.status === HiringRequestStatus.APPROVED;
  const isRejected = request?.status === HiringRequestStatus.REJECTED;
  const activeStep = STATUS_STEP[request?.status] ?? 0;
  const isCancelled = request?.status === HiringRequestStatus.CANCELLED;
  const hasChanges = form.isDirty();

  return {
    request,
    setRequest,
    loading,
    editing,
    setEditing,
    saving,
    resubmitting,
    cancelling,
    submittingDraft,
    managers,
    form,
    today,
    onSubmit,
    onResubmit,
    handleCancel,
    handleSubmitDraft,
    discardEdit,
    goBack,
    goToJob,
    isDraft,
    isPending,
    isApproved,
    isRejected,
    activeStep,
    isCancelled,
    hasChanges,
  };
}
