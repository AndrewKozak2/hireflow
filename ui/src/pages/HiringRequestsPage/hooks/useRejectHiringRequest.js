import { useState } from "react";
import { HiringRequestsService } from "../../../services/HiringRequestsService";
import { useNotifications } from "../../../hooks/useNotifications";

export function useRejectHiringRequest({ onRejected }) {
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const { onSuccess, onError } = useNotifications();

  const openRejectModal = (request) => {
    setRejectTarget(request);
  };

  const closeRejectModal = () => {
    setRejectTarget(null);
  };

  const confirmReject = async (reason) => {
    if (!rejectTarget) {
      return;
    }

    setRejecting(true);
    try {
      const updatedRequest = await HiringRequestsService.rejectHiringRequest(
        rejectTarget.id,
        reason,
      );

      if (updatedRequest) {
        onRejected(updatedRequest);
      }

      setRejectTarget(null);
      onSuccess({ message: "Hiring request rejected" });
    } catch {
      onError({ message: "Failed to reject hiring request" });
    } finally {
      setRejecting(false);
    }
  };

  return {
    rejectTarget,
    rejecting,
    openRejectModal,
    closeRejectModal,
    confirmReject,
  };
}
