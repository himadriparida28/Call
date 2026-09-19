/**
 * @fileoverview Notification Service
 *
 * API functions for managing in-app notifications: listing, filtering
 * by read status, marking individual or all notifications as read,
 * and retrieving unread counts for badge indicators.
 *
 * @module services/notificationService
 */

import api from './api';

// ---------------------------------------------------------------------------
// Service Functions
// ---------------------------------------------------------------------------

/**
 * Fetch all notifications for the authenticated user.
 *
 * @returns {Promise<Array<Object>>} List of notification objects.
 */
export const getNotifications = async () => {
  const response = await api.get('/notifications/');
  return response.data;
};

/**
 * Fetch only unread notifications.
 *
 * @returns {Promise<Array<Object>>} List of unread notification objects.
 */
export const getUnread = async () => {
  const response = await api.get('/notifications/unread/');
  return response.data;
};

/**
 * Fetch the count of unread notifications.
 *
 * Useful for rendering badge indicators without downloading the full
 * notification payloads.
 *
 * @returns {Promise<Object>} Object with `count` property, e.g. `{ count: 5 }`.
 */
export const getUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count/');
  return response.data;
};

/**
 * Mark a single notification as read.
 *
 * @param {number|string} id - Notification primary key.
 * @returns {Promise<Object>} Updated notification object.
 */
export const markAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read/`);
  return response.data;
};

/**
 * Mark all notifications as read in one bulk operation.
 *
 * @returns {Promise<Object>} Server confirmation.
 */
export const markAllAsRead = async () => {
  const response = await api.patch('/notifications/read-all/');
  return response.data;
};

const notificationService = {
  getNotifications,
  getUnread,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};

export default notificationService;
