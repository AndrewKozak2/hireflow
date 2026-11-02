import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "@mantine/form";
import { HiringRequestsService } from "../../../services/HiringRequestsService";
import { useAuthStore } from "../../../stores/useAuthStore";
import { useNotifications } from "../../../hooks/useNotifications";
import { useDateTime } from "../../../hooks/useDateTime";
import { ROUTES } from "../../../routes/routes";
import {
  HIRING_REQUEST_FORM_VALIDATE,
  HIRING_REQUEST_INITIAL_VALUES,
  requestToFormValues,
} from "../form/formConfig";
import { useHiringRequestFormState } from "./useHiringRequestFormState";

const AUTOSAVE_DELAY_MS = 3000;

function buildPayload(values, toISO) {
  // eslint-disable-next-line no-unused-vars
  const { submitter_email: _email, target_start_date, ...rest } = values;
  // Strip empty strings and nulls — PartialType keeps @IsNotEmpty() so empty strings fail validation
  const payload = Object.fromEntries(
    Object.entries(rest).filter(
      ([, v]) => v !== null && v !== undefined && v !== "",
    ),
  );
  if (target_start_date) {
    payload.target_start_date = toISO(target_start_date);
  }
  return payload;
}

export function useDraftHiringRequest({ draftId = null } = {}) {
  const navigate = useNavigate();
  const { onSuccess, onError } = useNotifications();
  const user = useAuthStore((s) => s.user);
  const { toISO } = useDateTime();
  const { managers, today } = useHiringRequestFormState();

  const [currentDraftId, setCurrentDraftId] = useState(draftId);
  // "idle" | "saving" | "saved" | "error"
  const [saveStatus, setSaveStatus] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(!!draftId);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  const debounceRef = useRef(null);
  const isFirstRender = useRef(true);
  const currentDraftIdRef = useRef(draftId);

  const form = useForm({
    initialValues: {
      submitter_email: user?.email ?? "",
      ...HIRING_REQUEST_INITIAL_VALUES,
    },
    validate: HIRING_REQUEST_FORM_VALIDATE,
  });

  // Keep ref in sync so saveDraft closure always has the latest id
  useEffect(() => {
    currentDraftIdRef.current = currentDraftId;
  }, [currentDraftId]);

  // Load existing draft on mount (loadingDraft is already initialised to !!draftId)
  useEffect(() => {
    if (!draftId) return;
    HiringRequestsService.getHiringRequestById(draftId)
      .then((data) => {
        form.setValues(requestToFormValues(data));
        form.resetDirty();
      })
      .catch(() => {
        onError({ message: "Draft not found" });
        navigate(ROUTES.HIRING_REQUESTS);
      })
      .finally(() => setLoadingDraft(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveDraft = useCallback(
    async (values) => {
      setSaveStatus("saving");
      try {
        const payload = buildPayload(values, toISO);
        const id = currentDraftIdRef.current;

        let saved;
        if (id) {
          saved = await HiringRequestsService.updateDraft(id, payload);
        } else {
          saved = await HiringRequestsService.createDraft(payload);
          setCurrentDraftId(saved.id);
          currentDraftIdRef.current = saved.id;
          // Update URL to the draft edit route without remounting
          const editPath = ROUTES.HIRING_REQUESTS_DRAFT_EDIT.replace(
            ":id",
            saved.id,
          );
          window.history.replaceState(null, "", editPath);
        }

        form.resetDirty();
        setSaveStatus("saved");
        setLastSavedAt(new Date());
      } catch {
        setSaveStatus("error");
      }
    },
    [toISO],
  );

  // Debounced autosave on form value changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!form.isDirty()) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveDraft(form.values);
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(debounceRef.current);
  }, [form.values]); // eslint-disable-line react-hooks/exhaustive-deps

  // Flush save on unmount if still dirty
  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      if (form.isDirty() && currentDraftIdRef.current) {
        saveDraft(form.values);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleManualSave = async () => {
    clearTimeout(debounceRef.current);
    await saveDraft(form.values);
    onSuccess({ message: "Draft saved" });
  };

  const handleSubmit = useCallback(
    async (values) => {
      clearTimeout(debounceRef.current);
      setSubmitting(true);
      try {
        const payload = buildPayload(values, toISO);
        const draftIdNow = currentDraftIdRef.current;
        if (draftIdNow) {
          await HiringRequestsService.submitDraft(draftIdNow, payload);
        } else {
          await HiringRequestsService.createHiringRequest(payload);
        }
        onSuccess({ message: "Your request has been submitted" });
        navigate(ROUTES.DASHBOARD);
      } catch {
        onError({ message: "Failed to submit hiring request" });
      } finally {
        setSubmitting(false);
      }
    },
    [toISO, onSuccess, onError, navigate],
  );

  const handleValidationFailure = () => {
    onError({
      title: "Check the form",
      message: "Please fill in all required fields correctly",
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files ?? []);
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  // eslint-disable-next-line react-hooks/refs
  const onSubmit = form.onSubmit(handleSubmit, handleValidationFailure);

  return {
    form,
    draftId: currentDraftId,
    saveStatus,
    lastSavedAt,
    loadingDraft,
    submitting,
    savingDraft: saveStatus === "saving",
    user,
    managers,
    today,
    attachments,
    fileInputRef,
    handleManualSave,
    handleFileChange,
    onSubmit,
  };
}
