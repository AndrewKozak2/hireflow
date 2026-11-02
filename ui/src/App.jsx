import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { useAuth } from "./hooks/useAuth";
import { useEffect } from "react";
import { useNotificationPolling } from "./hooks/useNotificationPolling";

function App() {
  const { fetchUser, isAuthenticated } = useAuth();
  useNotificationPolling(isAuthenticated);

  useEffect(() => {
    void fetchUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <RouterProvider router={router} />;
}

export default App;
