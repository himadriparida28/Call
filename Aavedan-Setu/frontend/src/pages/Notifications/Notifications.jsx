/**
 * Notifications.jsx
 * ==================
 * Notifications page — shows a timeline-style list of
 * notifications with read/unread status, type-based icons,
 * filter tabs (All / Unread), "Mark All Read" action,
 * loading skeletons, and an empty state.
 *
 * Uses the notification hooks:
 *   useNotifications, useUnreadNotifications, useUnreadCount,
 *   useMarkAsRead, useMarkAllAsRead
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiBellAlert,
  HiBell,
  HiCheckCircle,
  HiExclamationTriangle,
  HiInformationCircle,
  HiMegaphone,
  HiChatBubbleLeftRight,
  HiShieldCheck,
  HiDocumentText,
  HiEnvelope,
  HiEnvelopeOpen,
  HiCheck,
  HiInboxStack,
} from 'react-icons/hi2';
import { toast } from 'react-toastify';

import {
  useNotifications,
  useUnreadNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from '../../hooks/useNotifications';
import { formatRelativeTime } from '../../utils/helpers';

/* ──────────────── Constants ──────────────── */

/** Tab options */
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
];

/* ──────────────── Helpers ──────────────── */

/**
 * Returns an icon component and colour class based on
 * the notification type string.
 */
function getNotificationMeta(type) {
  switch (type?.toLowerCase()) {
    case 'success':
    case 'resolved':
      return { Icon: HiCheckCircle, color: 'text-success', bg: 'bg-success-light' };
    case 'warning':
      return { Icon: HiExclamationTriangle, color: 'text-warning', bg: 'bg-warning-light' };
    case 'error':
    case 'rejected':
      return { Icon: HiExclamationTriangle, color: 'text-danger', bg: 'bg-danger-light' };
    case 'info':
      return { Icon: HiInformationCircle, color: 'text-gov-500', bg: 'bg-gov-100' };
    case 'complaint':
    case 'complaint_update':
      return { Icon: HiChatBubbleLeftRight, color: 'text-gov-600', bg: 'bg-gov-100' };
    case 'announcement':
      return { Icon: HiMegaphone, color: 'text-accent', bg: 'bg-accent-light' };
    case 'verification':
      return { Icon: HiShieldCheck, color: 'text-success', bg: 'bg-success-light' };
    case 'document':
      return { Icon: HiDocumentText, color: 'text-warning', bg: 'bg-warning-light' };
    default:
      return { Icon: HiBell, color: 'text-gov-400', bg: 'bg-gov-50' };
  }
}

/* ──────────────── Sub-components ──────────────── */

/** Skeleton notification item */
const SkeletonItem = () => (
  <div className="flex items-start gap-4 p-4 animate-pulse">
    <div className="skeleton w-10 h-10 rounded-full shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="skeleton h-4 w-3/5 rounded" />
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-1/4 rounded" />
    </div>
  </div>
);

/** Loading state */
const LoadingState = () => (
  <div className="card divide-y divide-gray-100">
    {Array.from({ length: 6 }).map((_, i) => (
      <SkeletonItem key={i} />
    ))}
  </div>
);

/** Empty state */
const EmptyState = ({ isUnreadTab }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-24 text-center"
  >
    <div className="w-20 h-20 rounded-full bg-gov-100 flex items-center justify-center mb-5">
      <HiBellAlert className="w-10 h-10 text-gov-300" />
    </div>
    <h3 className="text-lg font-semibold text-gray-800 mb-1">
      {isUnreadTab ? 'All caught up!' : 'No notifications yet'}
    </h3>
    <p className="text-sm text-gray-500 max-w-xs">
      {isUnreadTab
        ? 'You have read all your notifications. Great job staying on top of things!'
        : 'Notifications about your complaints and government updates will appear here.'}
    </p>
  </motion.div>
);

/* ──────────────── Item animation variants ──────────────── */
const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: 'easeOut' },
  }),
  exit: { opacity: 0, x: 16, transition: { duration: 0.2 } },
};

/* ──────────────── Notification Item ──────────────── */
const NotificationItem = ({ notification, index, onMarkRead }) => {
  const { Icon, color, bg } = getNotificationMeta(notification.type);
  const isUnread = !notification.is_read && !notification.read;

  const handleClick = useCallback(() => {
    if (isUnread) onMarkRead(notification.id);
  }, [isUnread, notification.id, onMarkRead]);

  return (
    <motion.button
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      onClick={handleClick}
      className={`
        w-full flex items-start gap-4 p-4 md:p-5 text-left
        transition-colors duration-200 cursor-pointer
        ${isUnread ? 'bg-gov-50/60 hover:bg-gov-100/50' : 'hover:bg-gray-50'}
      `}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={`text-sm leading-snug ${
              isUnread ? 'font-semibold text-gov-800' : 'font-medium text-gray-700'
            }`}
          >
            {notification.title}
          </h4>
          {/* Unread dot */}
          {isUnread && (
            <span className="w-2.5 h-2.5 rounded-full bg-gov-500 shrink-0 mt-1.5" />
          )}
        </div>

        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
          {notification.message || notification.body}
        </p>

        <span className="text-[11px] text-gray-400 mt-2 inline-block">
          {formatRelativeTime(notification.created_at || notification.timestamp)}
        </span>
      </div>

      {/* Read status icon */}
      <div className="shrink-0 mt-0.5">
        {isUnread ? (
          <HiEnvelope className="w-4 h-4 text-gov-400" title="Unread" />
        ) : (
          <HiEnvelopeOpen className="w-4 h-4 text-gray-300" title="Read" />
        )}
      </div>
    </motion.button>
  );
};

/* ════════════════════════════════════════════════
   ███  Notifications — Main Page Component      ███
   ════════════════════════════════════════════════ */
const Notifications = () => {
  const [activeTab, setActiveTab] = useState('all');

  /* ── Data hooks ─── */
  const {
    data: allData,
    isLoading: allLoading,
    error: allError,
  } = useNotifications();

  const {
    data: unreadData,
    isLoading: unreadLoading,
    error: unreadError,
  } = useUnreadNotifications();

  const { data: unreadCountData } = useUnreadCount();

  /* ── Mutations ─── */
  const { mutateAsync: markAsRead, isPending: markingOne } = useMarkAsRead();
  const { mutateAsync: markAllAsRead, isPending: markingAll } = useMarkAllAsRead();

  /* Resolve active data */
  const isUnreadTab = activeTab === 'unread';
  const activeData = isUnreadTab ? unreadData : allData;
  const isLoading = isUnreadTab ? unreadLoading : allLoading;
  const error = isUnreadTab ? unreadError : allError;
  const notifications = activeData?.results ?? [];
  const unreadCount = unreadCountData?.count ?? unreadCountData ?? 0;

  /* ── Handlers ─── */
  const handleMarkRead = useCallback(
    async (id) => {
      try {
        await markAsRead(id);
      } catch {
        toast.error('Failed to mark notification as read.');
      }
    },
    [markAsRead]
  );

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  }, [markAllAsRead]);

  /* ── Render ─── */
  return (
    <div className="page-container max-w-3xl">
      {/* ── Page Header ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
      >
        <div className="flex items-center gap-3">
          <h1 className="page-title gradient-text text-2xl md:text-3xl">
            Notifications
          </h1>

          {/* Unread count badge */}
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-gov-600 text-white text-[11px] font-bold"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </div>

        {/* Mark All Read button */}
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="btn btn-secondary text-sm"
          >
            <HiCheck className="w-4 h-4" />
            {markingAll ? 'Marking…' : 'Mark All Read'}
          </button>
        )}
      </motion.div>

      {/* ── Filter Tabs ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              relative px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200
              ${
                activeTab === tab.key
                  ? 'bg-white text-gov-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            {tab.label}
            {/* Unread count next to "Unread" tab */}
            {tab.key === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 text-[10px] font-bold text-gov-500">
                ({unreadCount})
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* ── Content ────────────────────────────── */}
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card p-8 text-center"
        >
          <HiExclamationTriangle className="w-10 h-10 text-danger mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800 mb-1">Unable to load notifications</h3>
          <p className="text-sm text-gray-500">
            {error?.message || 'Something went wrong. Please try again later.'}
          </p>
        </motion.div>
      ) : notifications.length === 0 ? (
        <EmptyState isUnreadTab={isUnreadTab} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="card overflow-hidden divide-y divide-gray-100"
        >
          <AnimatePresence mode="popLayout">
            {notifications.map((notification, i) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                index={i}
                onMarkRead={handleMarkRead}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Footer summary ─────────────────────── */}
      {!isLoading && notifications.length > 0 && (
        <p className="text-center text-xs text-gray-400 mt-6">
          Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

export default Notifications;
