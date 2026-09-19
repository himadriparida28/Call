/**
 * @fileoverview Government Scheme Service
 *
 * Provides API functions for browsing and viewing government welfare
 * schemes. Supports server-side filtering by department, state,
 * category, and free-text search.
 *
 * @module services/schemeService
 */

import api from './api';

// ---------------------------------------------------------------------------
// Service Functions
// ---------------------------------------------------------------------------

/**
 * Fetch a paginated, filterable list of government schemes.
 *
 * @param {Object}  [params]            - Query parameters.
 * @param {string}  [params.search]     - Free-text search term.
 * @param {string}  [params.department] - Filter by government department.
 * @param {string}  [params.state]      - Filter by Indian state.
 * @param {string}  [params.category]   - Filter by scheme category.
 * @param {number}  [params.page]       - Page number (1-based).
 * @returns {Promise<Object>} Paginated response `{ count, next, previous, results }`.
 */
export const getSchemes = async (params = {}) => {
  const response = await api.get('/schemes/', { params });
  return response.data;
};

/**
 * Fetch full details for a single government scheme.
 *
 * @param {number|string} id - Scheme primary key.
 * @returns {Promise<Object>} Complete scheme object.
 */
export const getScheme = async (id) => {
  const response = await api.get(`/schemes/${id}/`);
  return response.data;
};

const schemeService = {
  getSchemes,
  getScheme,
};

export default schemeService;
