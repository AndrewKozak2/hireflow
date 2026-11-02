import { useAuthStore } from "../../stores/useAuthStore";
import HiringRequestDetailManagerPage from "./HiringRequestDetailManagerPage";
import HiringRequestDetailPage from "../HiringRequestDetailPage/HiringRequestDetailPage";

export default function HiringRequestDetailDispatch() {
  const user = useAuthStore((s) => s.user);

  if (user?.role === "hiring_manager") {
    return <HiringRequestDetailManagerPage />;
  }

  return <HiringRequestDetailPage />;
}
