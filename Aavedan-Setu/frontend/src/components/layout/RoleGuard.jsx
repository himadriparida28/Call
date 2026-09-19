/**
 * RoleGuard.jsx
 * ---------------
 * Restricts access based on user role.
 *
 * Props:
 *   allowedRoles – string[] of permitted roles (e.g. ['admin', 'officer'])
 *
 * Usage:
 *   <Route element={<RoleGuard allowedRoles={['admin']} />}>
 *     <Route path="admin" element={<AdminPage />} />
 *   </Route>
 */
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiShieldExclamation } from 'react-icons/hi2';
import { motion } from 'framer-motion';

export default function RoleGuard({ allowedRoles = [] }) {
  const { user } = useAuth();

  /* Check whether the current user's role appears in the allow-list */
  const hasAccess = user?.role && allowedRoles.includes(user.role);

  if (!hasAccess) {
    return (
      <motion.div
        className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        {/* Icon */}
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-danger-light text-danger text-4xl">
          <HiShieldExclamation />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>

        {/* Explanation */}
        <p className="mt-2 max-w-md text-sm text-gray-500">
          You don't have the required permissions to view this page. If you
          believe this is a mistake, please contact your administrator.
        </p>

        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          className="btn btn-secondary mt-6"
        >
          Go Back
        </button>
      </motion.div>
    );
  }

  /* Authorised – render nested routes */
  return <Outlet />;
}
