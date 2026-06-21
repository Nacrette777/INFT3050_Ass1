import { Navigate } from "react-router";
import { getCurrentUser } from "../../services/authService";

function ProtectedRoute({ children, allowedRoles }) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default ProtectedRoute;