import { notifications } from "@mantine/notifications";

export const useNotifications = () => {
  const onSuccess = ({
    message,
    title = "Success!",
    autoClose = true,
    color = "green",
    ...rest
  }) => {
    notifications.show({ title, message, color, autoClose, ...rest });
  };

  const onError = ({
    message,
    title = "Error",
    autoClose = true,
    color = "red",
    ...rest
  }) => {
    notifications.show({ title, message, color, autoClose, ...rest });
  };

  const onWarning = ({
    message,
    title = "Warning",
    autoClose = true,
    color = "yellow",
    ...rest
  }) => {
    notifications.show({ title, message, color, autoClose, ...rest });
  };

  const onInfo = ({
    message,
    title = "Info",
    autoClose = true,
    color = "blue",
    ...rest
  }) => {
    notifications.show({ title, message, color, autoClose, ...rest });
  };

  const onAction = ({
    message,
    title = "Action Required",
    autoClose = false,
    color = "grape",
    ...rest
  }) => {
    notifications.show({ title, message, color, autoClose, ...rest });
  };

  return {
    onSuccess,
    onError,
    onWarning,
    onInfo,
    onAction,
  };
};
