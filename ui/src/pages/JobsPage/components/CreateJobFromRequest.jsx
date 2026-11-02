import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Text } from "@mantine/core";
import { HiringRequestsService } from "../../../services/HiringRequestsService";

export default function CreateJobFromRequestButton({
  hiringRequestId,
  variant = "filled",
  size = "sm",
  color,
  radius,
  children = "Create Job from Request",
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = async () => {
    if (!hiringRequestId) {
      navigate("/jobs/new");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const prefill =
        await HiringRequestsService.getJobPrefill(hiringRequestId);
      navigate("/jobs/new", { state: { prefill } });
    } catch (err) {
      const message =
        err?.response?.data?.message ?? "Failed to load job prefill data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        color={color}
        radius={radius}
        loading={loading}
        onClick={handleClick}
      >
        {children}
      </Button>
      {error && (
        <Text c="red" size="xs" mt={4}>
          {error}
        </Text>
      )}
    </>
  );
}
