import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "@mantine/form";
import { HiringRequestsService } from "../../../services/HiringRequestsService";
import { useAuthStore } from "../../../stores/useAuthStore";
import { useNotifications } from "../../../hooks/useNotifications";
import { ROUTES } from "../../../routes/routes";
import {
  HIRING_REQUEST_FORM_VALIDATE,
  HIRING_REQUEST_INITIAL_VALUES,
} from "../form/formConfig";
import { useHiringRequestFormState } from "./useHiringRequestFormState";
import { useDateTime } from "../../../hooks/useDateTime";
import { ROLES } from "../../../constants/roles";

export function useNewHiringRequestForm() {
  const navigate = useNavigate();
  const { onSuccess, onError } = useNotifications();
  const user = useAuthStore((state) => state.user);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  const { managers, today } = useHiringRequestFormState();

  const { toISO } = useDateTime();

  const form = useForm({
    initialValues: {
      submitter_email: user?.email ?? "",
      ...HIRING_REQUEST_INITIAL_VALUES,
    },
    validate: HIRING_REQUEST_FORM_VALIDATE,
  });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files ?? []);
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const handleSubmit = async (values) => {
    // eslint-disable-next-line no-unused-vars
    const { submitter_email: _email, ...payload } = values;
    setSubmitting(true);
    try {
      await HiringRequestsService.createHiringRequest({
        ...payload,
        target_start_date: payload.target_start_date
          ? toISO(payload.target_start_date)
          : undefined,
      });
      onSuccess({ message: "Your request has been submitted" });
      navigate(ROUTES.DASHBOARD);
    } catch {
      onError({ message: "Failed to submit hiring request" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidationFailure = () => {
    onError({
      title: "Check the form",
      message: "Please fill in all required fields correctly",
    });
  };

  const handleSaveDraft = async () => {
    // eslint-disable-next-line no-unused-vars
    const { submitter_email: _email, target_start_date, ...rest } = form.values;
    // Strip empty strings and nulls — PartialType keeps @IsNotEmpty() so empty strings fail validation
    const payload = Object.fromEntries(
      Object.entries(rest).filter(
        ([, v]) => v !== null && v !== undefined && v !== "",
      ),
    );
    if (target_start_date) payload.target_start_date = toISO(target_start_date);
    setSavingDraft(true);
    try {
      const draft = await HiringRequestsService.createDraft(payload);
      onSuccess({ message: "Draft saved — you can continue editing any time" });
      navigate(ROUTES.HIRING_REQUESTS_DRAFT_EDIT.replace(":id", draft.id));
    } catch {
      onError({ message: "Failed to save draft" });
    } finally {
      setSavingDraft(false);
    }
  };

  const onSubmit = form.onSubmit(handleSubmit, handleValidationFailure);

  const isHiringManager = user?.role === ROLES.MANAGER;

  return {
    form,
    onSubmit,
    user,
    managers,
    attachments,
    fileInputRef,
    today,
    submitting,
    savingDraft,
    handleFileChange,
    // only expose for hiring managers (admins submit directly)
    onSaveDraft: isHiringManager ? handleSaveDraft : undefined,
  };
}
