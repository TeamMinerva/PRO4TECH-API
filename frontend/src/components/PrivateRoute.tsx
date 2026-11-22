import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AUTH_UNAUTHORIZED_EVENT,
  isAuthenticated,
  verifySessionWithServer,
} from "../services/authService";

interface RouteGuardProps {
  children?: ReactNode;
}

export function PrivateRoute({ children }: RouteGuardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [autenticado, setAutenticado] = useState<boolean>(() => isAuthenticated());
  const sessaoValida = autenticado && isAuthenticated();

  useEffect(() => {
    if (!sessaoValida) {
      return;
    }

    void verifySessionWithServer();
  }, [location.pathname, sessaoValida]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setAutenticado(false);
      navigate("/", {
        replace: true,
        state: {
          from: location,
          authError: "Faça login para acessar esta página.",
        },
      });
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === "auth_token") {
        if (!isAuthenticated()) {
          handleUnauthorized();
        }
      }
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
      window.removeEventListener("storage", handleStorage);
    };
  }, [location, navigate]);

  if (!sessaoValida) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          from: location,
          authError: "Faça login para acessar esta página.",
        }}
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
}

export function PublicOnlyRoute({ children }: RouteGuardProps) {
  if (isAuthenticated()) {
    return <Navigate to="/home" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
