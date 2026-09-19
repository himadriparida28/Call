/**
 * @fileoverview Authentication Service
 *
 * Provides functions for every auth-related API interaction:
 * registration, login, logout, profile management, and token refresh.
 *
 * Tokens are persisted in localStorage under the keys defined in the
 * central API module (`access_token` / `refresh_token`).
 *
 * @module services/authService
 */

import api from './api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** @type {string} localStorage key for the JWT access token */
const ACCESS_TOKEN_KEY = 'access_token';

/** @type {string} localStorage key for the JWT refresh token */
const REFRESH_TOKEN_KEY = 'refresh_token';

// ---------------------------------------------------------------------------
// Service Functions
// ---------------------------------------------------------------------------

/**
 * Register a new user account.
 *
 * @param {Object} data - Registration payload.
 * @param {string} data.full_name - User full name.
 * @param {string} data.email     - User email.
 * @param {string} data.phone     - User phone number.
 * @param {string} data.password  - Chosen password.
 * @returns {Promise<Object>} The newly created user data from the server.
 */
export const register = async (data) => {
  const response = await api.post('/auth/register/', data);
  
  // Persist tokens if auto-authenticated on registration
  const tokens = response.data?.tokens;
  if (tokens?.access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  }
  if (tokens?.refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }

  return response.data;
};

/**
 * Authenticate a user and persist JWT tokens.
 *
 * @param {Object} data - Login credentials.
 * @param {string} data.identifier - User email or phone number.
 * @param {string} data.password   - User password.
 * @returns {Promise<Object>} Server response (tokens + user info).
 */
export const login = async (data) => {
  const response = await api.post('/auth/login/', data);

  // Persist tokens for future requests (tokens are nested under response.data.tokens)
  const tokens = response.data?.tokens;
  if (tokens?.access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  }
  if (tokens?.refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }

  return response.data;
};

/**
 * Send an OTP code to a citizen's phone number for login.
 *
 * @param {Object} data
 * @param {string} data.phone - Phone number.
 * @returns {Promise<Object>} OTP status response.
 */
export const sendOTP = async (data) => {
  const response = await api.post('/auth/send-otp/', data);
  return response.data;
};

/**
 * Verify phone OTP and authenticate user.
 *
 * @param {Object} data
 * @param {string} data.phone - Phone number.
 * @param {string} data.otp   - Recieved OTP.
 * @returns {Promise<Object>} Auth tokens + profile.
 */
export const verifyOTP = async (data) => {
  const response = await api.post('/auth/verify-otp/', data);

  const tokens = response.data?.tokens;
  if (tokens?.access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  }
  if (tokens?.refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }

  return response.data;
};

/**
 * Log the current user out.
 *
 * @returns {Promise<Object|null>} Server response data, or null on error.
 */
export const logout = async () => {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  try {
    const response = await api.post('/auth/logout/', {
      refresh: refreshToken,
    });
    return response.data;
  } catch (error) {
    console.warn('Logout API call failed – clearing local tokens anyway.', error);
    return null;
  } finally {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

/**
 * Fetch the authenticated user's profile.
 *
 * @returns {Promise<Object>} User profile data.
 */
export const getProfile = async () => {
  const response = await api.get('/auth/profile/');
  return response.data;
};

/**
 * Partially update the authenticated user's profile.
 *
 * @param {Object} data - Fields to update (PATCH semantics).
 * @returns {Promise<Object>} The updated profile data.
 */
export const updateProfile = async (data) => {
  const response = await api.patch('/auth/profile/', data);
  return response.data;
};

/**
 * Refresh the access token using the stored refresh token.
 *
 * @returns {Promise<Object>} New token pair `{ access, refresh? }`.
 */
export const refreshToken = async () => {
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);

  const response = await api.post('/auth/token/refresh/', { refresh });

  if (response.data.access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, response.data.access);
  }
  if (response.data.refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh);
  }

  return response.data;
};

const authService = {
  register,
  login,
  sendOTP,
  verifyOTP,
  logout,
  getProfile,
  updateProfile,
  refreshToken,
};

export default authService;
