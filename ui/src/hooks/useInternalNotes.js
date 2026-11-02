import { useState, useCallback } from "react";
import { HiringRequestsService } from "../services/HiringRequestsService";
import { useNotifications } from "../hooks/useNotifications";

export function useInternalNotes({ requestId, onUpdate }) {
  const { onError } = useNotifications();
  const [rawNotes, setRawNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const setNotes = useCallback((value) => {
    if (value && typeof value === "object") {
      const textVal = value.target?.value ?? value.text ?? "";
      setRawNotes(String(textVal));
    } else {
      setRawNotes(String(value ?? ""));
    }
  }, []);

  const handleSaveNotes = useCallback(
    async (canManage, isPending) => {
      let textToSend = "";

      setRawNotes((currentText) => {
        textToSend = String(currentText).trim();
        return currentText;
      });

      if (!canManage || isPending || !textToSend) {
        return;
      }

      setIsSaving(true);
      try {
        const cleanDto = {
          text: textToSend,
        };

        const updatedRequest =
          await HiringRequestsService.addHiringRequestInternalNote(
            requestId,
            cleanDto,
          );

        if (updatedRequest) {
          onUpdate(updatedRequest);
          setRawNotes("");
          setIsSaved(true);
          window.setTimeout(() => setIsSaved(false), 2000);
        }
      } catch (error) {
        console.error("Failed to save note", error);
        onError({
          message:
            error?.response?.data?.message ||
            "Failed to save internal note. Please try again.",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [requestId, onUpdate, onError],
  );

  return {
    notes: rawNotes,
    setNotes,
    isSaving,
    isSaved,
    handleSaveNotes,
  };
}
