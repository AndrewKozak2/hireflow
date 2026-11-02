import { useState } from "react";
import { TextInput, Select, Button, Stack } from "@mantine/core";
import { IconSend, IconCheck } from "@tabler/icons-react";
import { useNotifications } from "../../../hooks/useNotifications";
import { AuthService } from "../../../services/AuthService";

export default function InviteUserForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("recruiter");
  const [loading, setLoading] = useState(false);
  const { onSuccess, onError } = useNotifications();

  const handleInvite = async () => {
    if (!email) {
      onError({ message: "Please enter an email" });
      return;
    }

    setLoading(true);
    try {
      await AuthService.inviteUser({ email, role });

      onSuccess({
        title: "Invitation sent!",
        message: `An email has been sent to ${email}`,
        icon: <IconCheck size={16} />,
      });

      setEmail("");
    } catch (error) {
      onError({
        title: "Error",
        message: error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack>
      <TextInput
        label="Email address"
        placeholder="colleague@company.com"
        required
        value={email}
        onChange={(e) => setEmail(e.currentTarget.value)}
      />
      <Select
        label="User Role"
        placeholder="Pick a role"
        required
        data={[
          { value: "hiring_manager", label: "Hiring Manager" },
          { value: "recruiter", label: "Recruiter" },
        ]}
        value={role}
        onChange={setRole}
        allowDeselect={false}
      />
      <Button
        fullWidth
        onClick={handleInvite}
        loading={loading}
        leftSection={<IconSend size={16} />}
      >
        Send Invitation
      </Button>
    </Stack>
  );
}
