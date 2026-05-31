import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface AdminRouteProps {
  children: React.ReactNode;
}

/** Renders children only when the active session has ADMIN role. */
export default function AdminRoute({ children }: AdminRouteProps) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "ADMIN") return <Navigate to="/inicio" replace />;
  return <>{children}</>;
}
