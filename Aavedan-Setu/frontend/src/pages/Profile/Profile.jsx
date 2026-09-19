/**
 * Profile.jsx
 * ============
 * User profile page — two-column layout (stacked on mobile).
 *
 * Left:  Profile card (avatar, stats, member-since date)
 * Right: Edit-profile form (React Hook Form) + Change-password section
 *
 * Integrates:
 *  - useAuth()  →  user data + updateProfile
 *  - React Hook Form  →  validation & submission
 *  - React Toastify  →  success / error toasts
 *  - Framer Motion  →  staggered section animations
 */

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  HiUser,
  HiEnvelope,
  HiPhone,
  HiMapPin,
  HiCalendarDays,
  HiPencilSquare,
  HiCamera,
  HiLockClosed,
  HiEye,
  HiEyeSlash,
  HiCheckCircle,
  HiExclamationTriangle,
  HiShieldCheck,
  HiDocumentText,
  HiArrowPath,
} from 'react-icons/hi2';
import { toast } from 'react-toastify';

import { useAuth } from '../../context/AuthContext';
import { indianStates } from '../../utils/helpers';
import { formatDate, getInitials } from '../../utils/helpers';

/* ──────────────── Animation Variants ──────────────── */
const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
};

/* ──────────────── Loading Skeleton ──────────────── */
const ProfileSkeleton = () => (
  <div className="page-container animate-pulse">
    <div className="skeleton h-8 w-48 rounded mb-8" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left card skeleton */}
      <div className="card p-8 flex flex-col items-center space-y-4">
        <div className="skeleton w-28 h-28 rounded-full" />
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="flex gap-6 mt-4 w-full justify-center">
          <div className="skeleton h-16 w-24 rounded-xl" />
          <div className="skeleton h-16 w-24 rounded-xl" />
        </div>
      </div>

      {/* Right form skeleton */}
      <div className="lg:col-span-2 space-y-6">
        <div className="card p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n}>
              <div className="skeleton h-3 w-20 rounded mb-2" />
              <div className="skeleton h-10 w-full rounded-lg" />
            </div>
          ))}
          <div className="skeleton h-10 w-36 rounded-lg" />
        </div>
      </div>
    </div>
  </div>
);

/* ──────────────── Password Toggle Hook ──────────────── */
function usePasswordToggle() {
  const [visible, setVisible] = useState(false);
  const toggle = () => setVisible((v) => !v);
  const Icon = visible ? HiEyeSlash : HiEye;
  const type = visible ? 'text' : 'password';
  return { type, Icon, toggle };
}

/* ──────────────── Stat Card ──────────────── */
const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="flex flex-col items-center p-4 rounded-xl bg-surface-alt">
    <Icon className={`w-5 h-5 ${color} mb-1`} />
    <span className="text-xl font-bold text-gov-800">{value ?? '—'}</span>
    <span className="text-[11px] text-gray-500 font-medium">{label}</span>
  </div>
);

/* ════════════════════════════════════════════════
   ███  Profile — Main Page Component            ███
   ════════════════════════════════════════════════ */
const Profile = () => {
  const { user, updateProfile } = useAuth();

  /* ── Password visibility toggles ─── */
  const currentPw = usePasswordToggle();
  const newPw = usePasswordToggle();
  const confirmPw = usePasswordToggle();

  /* ── Edit Profile Form (React Hook Form) ─── */
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
    reset: resetProfile,
  } = useForm({
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      address: '',
      state: '',
    },
  });

  /* Populate form once user data arrives */
  useEffect(() => {
    if (user) {
      resetProfile({
        full_name: user.full_name || user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        state: user.state || '',
      });
    }
  }, [user, resetProfile]);

  /* ── Change Password Form ─── */
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
    reset: resetPassword,
    watch: watchPassword,
  } = useForm({
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const newPasswordValue = watchPassword('new_password');

  /* ── Handlers ─── */
  const onProfileSubmit = async (data) => {
    try {
      await updateProfile(data);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile. Please try again.');
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      await updateProfile({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      toast.success('Password changed successfully!');
      resetPassword();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to change password. Please try again.');
    }
  };

  /* ── Loading guard ─── */
  if (!user) return <ProfileSkeleton />;

  let sectionIdx = 0;

  /* ── Render ─── */
  return (
    <div className="page-container pb-16">
      {/* ── Page Header ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="page-title gradient-text text-2xl md:text-3xl">
          My Profile
        </h1>
        <p className="page-subtitle mt-1">
          View and manage your account details.
        </p>
      </motion.div>

      {/* ── Two-column layout ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ══════════ LEFT COLUMN — Profile Card ══════════ */}
        <motion.aside
          custom={sectionIdx++}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="card p-6 md:p-8 text-center sticky top-6">
            {/* Avatar */}
            <div className="relative inline-block mb-5">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gov-500 to-gov-700 flex items-center justify-center mx-auto text-white text-3xl font-bold shadow-lg">
                {getInitials(user.full_name || user.name || user.email)}
              </div>

              {/* Camera overlay button */}
              <button
                type="button"
                className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gov-50 transition-colors"
                title="Change avatar"
              >
                <HiCamera className="w-4 h-4 text-gov-600" />
              </button>
            </div>

            {/* Name */}
            <h2 className="text-lg font-bold text-gov-800 mb-0.5">
              {user.full_name || user.name || 'User'}
            </h2>

            {/* Email */}
            <p className="text-sm text-gray-500 flex items-center justify-center gap-1.5 mb-1">
              <HiEnvelope className="w-3.5 h-3.5" />
              {user.email}
            </p>

            {/* Phone */}
            {user.phone && (
              <p className="text-sm text-gray-500 flex items-center justify-center gap-1.5 mb-3">
                <HiPhone className="w-3.5 h-3.5" />
                {user.phone}
              </p>
            )}

            {/* Member since */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mb-6">
              <HiCalendarDays className="w-3.5 h-3.5" />
              Member since {formatDate(user.date_joined || user.created_at)}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 pt-5">
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Total Complaints"
                  value={user.total_complaints ?? user.complaints_count ?? 0}
                  icon={HiDocumentText}
                  color="text-gov-500"
                />
                <StatCard
                  label="Resolved"
                  value={user.resolved_complaints ?? user.resolved_count ?? 0}
                  icon={HiCheckCircle}
                  color="text-success"
                />
              </div>
            </div>
          </div>
        </motion.aside>

        {/* ══════════ RIGHT COLUMN — Forms ══════════ */}
        <div className="lg:col-span-2 space-y-8">
          {/* ── Edit Profile Form ──────────────── */}
          <motion.div
            custom={sectionIdx++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="card p-6 md:p-8">
              <h2 className="flex items-center gap-2 text-base font-bold text-gov-800 mb-6">
                <HiPencilSquare className="w-5 h-5 text-gov-500" />
                Edit Profile
              </h2>

              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label htmlFor="full_name" className="form-label">
                    Full Name
                  </label>
                  <div className="relative">
                    <HiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="full_name"
                      type="text"
                      placeholder="Enter your full name"
                      className={`form-input pl-10 ${profileErrors.full_name ? 'form-input-error' : ''}`}
                      {...registerProfile('full_name', {
                        required: 'Full name is required',
                        minLength: { value: 2, message: 'Name must be at least 2 characters' },
                      })}
                    />
                  </div>
                  {profileErrors.full_name && (
                    <p className="form-error">{profileErrors.full_name.message}</p>
                  )}
                </div>

                {/* Email (read-only) */}
                <div>
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <div className="relative">
                    <HiEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      disabled
                      className="form-input pl-10 bg-gray-50 cursor-not-allowed opacity-70"
                      {...registerProfile('email')}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Email address cannot be changed.
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="form-label">
                    Phone Number
                  </label>
                  <div className="relative">
                    <HiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      className={`form-input pl-10 ${profileErrors.phone ? 'form-input-error' : ''}`}
                      {...registerProfile('phone', {
                        pattern: {
                          value: /^[+]?[\d\s()-]{7,15}$/,
                          message: 'Please enter a valid phone number',
                        },
                      })}
                    />
                  </div>
                  {profileErrors.phone && (
                    <p className="form-error">{profileErrors.phone.message}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="form-label">
                    Address
                  </label>
                  <div className="relative">
                    <HiMapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      id="address"
                      rows={3}
                      placeholder="Enter your full address"
                      className={`form-input pl-10 resize-none ${profileErrors.address ? 'form-input-error' : ''}`}
                      {...registerProfile('address')}
                    />
                  </div>
                  {profileErrors.address && (
                    <p className="form-error">{profileErrors.address.message}</p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label htmlFor="state" className="form-label">
                    State
                  </label>
                  <select
                    id="state"
                    className={`form-input ${profileErrors.state ? 'form-input-error' : ''}`}
                    {...registerProfile('state')}
                  >
                    <option value="">Select your state</option>
                    {indianStates.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {profileErrors.state && (
                    <p className="form-error">{profileErrors.state.message}</p>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={profileSubmitting}
                    className="btn btn-primary"
                  >
                    {profileSubmitting ? (
                      <>
                        <HiArrowPath className="w-4 h-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <HiCheckCircle className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>

          {/* ── Change Password Section ─────────── */}
          <motion.div
            custom={sectionIdx++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="card p-6 md:p-8">
              <h2 className="flex items-center gap-2 text-base font-bold text-gov-800 mb-6">
                <HiShieldCheck className="w-5 h-5 text-gov-500" />
                Change Password
              </h2>

              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5">
                {/* Current Password */}
                <div>
                  <label htmlFor="current_password" className="form-label">
                    Current Password
                  </label>
                  <div className="relative">
                    <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="current_password"
                      type={currentPw.type}
                      placeholder="Enter current password"
                      className={`form-input pl-10 pr-10 ${
                        passwordErrors.current_password ? 'form-input-error' : ''
                      }`}
                      {...registerPassword('current_password', {
                        required: 'Current password is required',
                      })}
                    />
                    <button
                      type="button"
                      onClick={currentPw.toggle}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      <currentPw.Icon className="w-4 h-4" />
                    </button>
                  </div>
                  {passwordErrors.current_password && (
                    <p className="form-error">{passwordErrors.current_password.message}</p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label htmlFor="new_password" className="form-label">
                    New Password
                  </label>
                  <div className="relative">
                    <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="new_password"
                      type={newPw.type}
                      placeholder="Enter new password"
                      className={`form-input pl-10 pr-10 ${
                        passwordErrors.new_password ? 'form-input-error' : ''
                      }`}
                      {...registerPassword('new_password', {
                        required: 'New password is required',
                        minLength: { value: 8, message: 'Password must be at least 8 characters' },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                          message: 'Password must contain uppercase, lowercase, and a number',
                        },
                      })}
                    />
                    <button
                      type="button"
                      onClick={newPw.toggle}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      <newPw.Icon className="w-4 h-4" />
                    </button>
                  </div>
                  {passwordErrors.new_password && (
                    <p className="form-error">{passwordErrors.new_password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirm_password" className="form-label">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="confirm_password"
                      type={confirmPw.type}
                      placeholder="Re-enter new password"
                      className={`form-input pl-10 pr-10 ${
                        passwordErrors.confirm_password ? 'form-input-error' : ''
                      }`}
                      {...registerPassword('confirm_password', {
                        required: 'Please confirm your new password',
                        validate: (value) =>
                          value === newPasswordValue || 'Passwords do not match',
                      })}
                    />
                    <button
                      type="button"
                      onClick={confirmPw.toggle}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      <confirmPw.Icon className="w-4 h-4" />
                    </button>
                  </div>
                  {passwordErrors.confirm_password && (
                    <p className="form-error">{passwordErrors.confirm_password.message}</p>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordSubmitting}
                    className="btn btn-primary"
                  >
                    {passwordSubmitting ? (
                      <>
                        <HiArrowPath className="w-4 h-4 animate-spin" />
                        Changing…
                      </>
                    ) : (
                      <>
                        <HiLockClosed className="w-4 h-4" />
                        Change Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
