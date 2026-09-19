/**
 * ProtectedRoute.jsx
 * --------------------
 * Wraps any route that requires an authenticated user.
 *
 * Behaviour:
 *   1. While auth state is loading → show a full-screen spinner.
 *   2. If user is NOT authenticated → redirect to /login (preserving the
 *      current path as a `from` search-param so we can redirect back later).
 *   3. If authenticated → render child routes via <Outlet />.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  /* Still resolving auth state – show a non-blocking spinner */
  if (loading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  /* Not logged in – bounce to the login page */
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  /* Authenticated – render the nested route tree */
  return <Outlet />;
}
