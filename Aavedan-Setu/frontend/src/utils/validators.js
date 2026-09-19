/**
 * @fileoverview Form Validation Rules for react-hook-form
 *
 * Pre-built validation rule objects designed to be spread directly into
 * `register()` calls from react-hook-form. Every rule set includes
 * user-friendly error messages.
 *
 * @module utils/validators
 *
 * @example
 * import { emailRules, passwordRules } from '@/utils/validators';
 *
 * <input {...register('email', emailRules)} />
 * <input {...register('password', passwordRules)} />
 */

// ═══════════════════════════════════════════════════════════════════════════
// Patterns
// ═══════════════════════════════════════════════════════════════════════════

/**
 * RFC 5322 simplified email regex.
 * @type {RegExp}
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Indian phone number pattern (10 digits, optionally prefixed with +91).
 * @type {RegExp}
 */
const PHONE_REGEX = /^(?:\+91)?[6-9]\d{9}$/;

/**
 * Password strength regex:
 * - At least 1 lowercase letter
 * - At least 1 uppercase letter
 * - At least 1 digit
 * - Minimum 8 characters
 * @type {RegExp}
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// ═══════════════════════════════════════════════════════════════════════════
// Validation Rule Sets
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validation rules for email fields.
 *
 * @type {Object}
 * @property {string}  required         - Required field message.
 * @property {Object}  pattern          - Regex pattern validation.
 * @property {RegExp}  pattern.value    - Email regex.
 * @property {string}  pattern.message  - Error message on pattern mismatch.
 */
export const emailRules = {
  required: 'Email address is required',
  pattern: {
    value: EMAIL_REGEX,
    message: 'Please enter a valid email address',
  },
};

/**
 * Validation rules for Indian phone number fields.
 *
 * Phone is typically optional, so `required` is omitted. Add it in
 * the consuming component if the field should be mandatory.
 *
 * @type {Object}
 * @property {Object}  pattern          - Regex pattern validation.
 * @property {RegExp}  pattern.value    - Indian phone regex.
 * @property {string}  pattern.message  - Error message on pattern mismatch.
 */
export const phoneRules = {
  pattern: {
    value: PHONE_REGEX,
    message: 'Please enter a valid 10-digit Indian phone number',
  },
};

/**
 * Validation rules for password fields.
 *
 * Enforces a minimum of 8 characters with at least one uppercase letter,
 * one lowercase letter, and one digit.
 *
 * @type {Object}
 * @property {string}  required           - Required field message.
 * @property {number}  minLength.value    - Minimum length.
 * @property {string}  minLength.message  - Error when too short.
 * @property {number}  maxLength.value    - Maximum length.
 * @property {string}  maxLength.message  - Error when too long.
 * @property {Object}  pattern            - Regex pattern validation.
 * @property {RegExp}  pattern.value      - Password strength regex.
 * @property {string}  pattern.message    - Error on pattern mismatch.
 */
export const passwordRules = {
  required: 'Password is required',
  minLength: {
    value: 8,
    message: 'Password must be at least 8 characters long',
  },
  maxLength: {
    value: 128,
    message: 'Password must not exceed 128 characters',
  },
  pattern: {
    value: PASSWORD_REGEX,
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  },
};

/**
 * Generic "required" rule — use when a field simply cannot be empty.
 *
 * @param {string} [fieldName='This field'] - Human-readable field name for the error message.
 * @returns {Object} Validation rules object with `required` set.
 *
 * @example
 * <input {...register('title', requiredRule('Title'))} />
 */
export const requiredRule = (fieldName = 'This field') => ({
  required: `${fieldName} is required`,
});

/**
 * Validation rules for name fields (first name, last name, etc.).
 *
 * Enforces 2–50 characters and only allows letters, spaces, hyphens,
 * and apostrophes (to support names like "O'Brien" or "Mary-Jane").
 *
 * @type {Object}
 */
export const nameRules = {
  required: 'Name is required',
  minLength: {
    value: 2,
    message: 'Name must be at least 2 characters long',
  },
  maxLength: {
    value: 50,
    message: 'Name must not exceed 50 characters',
  },
  pattern: {
    value: /^[a-zA-Z\s'-]+$/,
    message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  },
};
