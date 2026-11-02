import { Group, Button } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useOfferOutcome } from "../hooks/useOfferOutcome";
import { DeclineOfferModal } from "../components/DeclineOfferModal";
import { notifications } from "@mantine/notifications";

export function OfferOutcomeActions({ application, onUpdate }) {
  const { handleAccept, handleDecline, isLoading } = useOfferOutcome(
    application,
    onUpdate,
  );

  const openDeclineModal = () => {
    modals.open({
      title: "Mark as Declined",
      children: (
        <DeclineOfferModal
          onSubmit={async (values) => {
            try {
              await handleDecline(values);
              notifications.show({
                message: "Application marked as declined",
                color: "gray",
              });
              modals.closeAll();
              onUpdate?.();
            } catch {
              notifications.show({
                title: "Error",
                message: "Failed to decline offer",
                color: "red",
              });
            }
          }}
          onCancel={() => modals.closeAll()}
        />
      ),
    });
  };

  if (application.stage !== "OFFER") return null;

  return (
    <Group mt="md">
      <Button color="green" onClick={handleAccept} loading={isLoading}>
        Mark as Accepted
      </Button>

      <Button
        variant="light"
        color="red"
        onClick={openDeclineModal}
        disabled={isLoading}
      >
        Mark as Declined
      </Button>
    </Group>
  );
}
