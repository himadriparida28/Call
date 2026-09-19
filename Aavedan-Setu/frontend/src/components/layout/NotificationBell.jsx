/**
 * NotificationBell.jsx
 * ----------------------
 * A bell icon with a red unread-count badge. Clicking it opens a small
 * dropdown with a link to the full notifications page.
 *
 * External hooks:
 *   useUnreadCount() → { data: { count: number } }
 */
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiBell } from 'react-icons/hi2';
import { motion, AnimatePresence } from 'framer-motion';
import { useUnreadCount } from '../../hooks/useNotifications';

export default function NotificationBell() {
  const { data } = useUnreadCount();
  const count = data?.count ?? 0;

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gov-50 hover:text-gov-600 transition-colors"
        aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
      >
        <HiBell className="h-5 w-5" />

        {/* Unread badge */}
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white"
          >
            {count > 99 ? '99+' : count}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-100 bg-white shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h4 className="text-sm font-semibold text-gray-800">Notifications</h4>
              {count > 0 && (
                <span className="badge bg-danger-light text-danger text-xs">{count} new</span>
              )}
            </div>

            {/* Body */}
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              {count > 0
                ? `You have ${count} unread notification${count > 1 ? 's' : ''}`
                : 'All caught up!'}
            </div>

            {/* Footer link */}
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-gray-100 px-4 py-2.5 text-center text-xs font-semibold text-gov-600 hover:bg-gov-50 transition-colors"
            >
              View all notifications
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
