import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Get the login token from localStorage
  const token = localStorage.getItem("token");

  // If the user is not logged in, redirect to Login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If the user is logged in, show the requested page
  return <>{children}</>;
}
