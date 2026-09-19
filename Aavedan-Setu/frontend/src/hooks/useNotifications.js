/**
 * @fileoverview Notification React Query Hooks
 *
 * Custom hooks for fetching and managing in-app notifications with
 * TanStack React Query. Includes queries for listing notifications
 * and mutations for marking them as read.
 *
 * ## Query Key Conventions
 * | Hook                  | Key                              |
 * |-----------------------|----------------------------------|
 * | useNotifications      | `['notifications']`              |
 * | useUnreadNotifications| `['notifications', 'unread']`    |
 * | useUnreadCount        | `['notifications', 'unreadCount']`|
 *
 * @module hooks/useNotifications
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as notificationService from '../services/notificationService';

// ═══════════════════════════════════════════════════════════════════════════
// Query Hooks
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch all notifications for the authenticated user.
 *
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getNotifications,
    staleTime: 1000 * 30, // 30 seconds — notifications update frequently
  });
};

/**
 * Fetch only unread notifications.
 *
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export const useUnreadNotifications = () => {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: notificationService.getUnread,
    staleTime: 1000 * 30,
  });
};

/**
 * Fetch the unread notification count.
 *
 * Ideal for rendering a badge indicator in the navbar. Uses a short
 * refetch interval so the count stays current.
 *
 * @returns {import('@tanstack/react-query').UseQueryResult}
 *
 * @example
 * const { data } = useUnreadCount();
 * const count = data?.count ?? 0;
 */
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: notificationService.getUnreadCount,
    staleTime: 1000 * 15, // 15 seconds
    refetchInterval: 1000 * 60, // Poll every 60 seconds for live count
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// Mutation Hooks
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mutation hook to mark a single notification as read.
 *
 * Invalidates all notification queries on success to keep lists and
 * counts in sync.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 *
 * @example
 * const { mutate: markAsRead } = useMarkAsRead();
 * markAsRead(notificationId);
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to mark notification as read.';
      toast.error(message);
    },
  });
};

/**
 * Mutation hook to mark all notifications as read in bulk.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 *
 * @example
 * const { mutate: markAllAsRead } = useMarkAllAsRead();
 * <button onClick={() => markAllAsRead()}>Mark all as read</button>
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read.');
    },
    onError: (error) => {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to mark notifications as read.';
      toast.error(message);
    },
  });
};
