import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSessionGuard } from "../hooks/useSessionGuard";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import InicioPage from "../pages/InicioPage";
import ProjetosPage from "../pages/ProjetosPage";
import ProjectDetailPage from "../pages/ProjectDetailPage";
import BoardPage from "../pages/BoardPage";
import ItemsPage from "../pages/ItemsPage";
import AppShell from "../components/layout/AppShell";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function ShellRoute({ children }: { children: React.ReactNode }) {
  return (
    <PrivateRoute>
      <AppShell>{children}</AppShell>
    </PrivateRoute>
  );
}

function SessionGuard() {
  useSessionGuard();
  return null;
}

/** Application router with public auth routes and shell-wrapped protected routes. */
export default function AppRouter() {
  return (
    <BrowserRouter>
      <SessionGuard />
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes — wrapped in AppShell */}
        <Route
          path="/inicio"
          element={
            <ShellRoute>
              <InicioPage />
            </ShellRoute>
          }
        />
        <Route
          path="/board"
          element={
            <ShellRoute>
              <BoardPage />
            </ShellRoute>
          }
        />
        <Route
          path="/itens"
          element={
            <ShellRoute>
              <ItemsPage />
            </ShellRoute>
          }
        />
        {/* Legacy redirects */}
        <Route path="/features" element={<Navigate to="/board" replace />} />
        <Route
          path="/user-stories"
          element={<Navigate to="/board?type=USER_STORY" replace />}
        />
        <Route
          path="/features/:featureId/user-stories"
          element={<Navigate to="/board?type=USER_STORY" replace />}
        />
        <Route
          path="/projetos"
          element={
            <ShellRoute>
              <ProjetosPage />
            </ShellRoute>
          }
        />

        <Route
          path="/projetos/:id"
          element={
            <ShellRoute>
              <ProjectDetailPage />
            </ShellRoute>
          }
        />


        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/inicio" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

