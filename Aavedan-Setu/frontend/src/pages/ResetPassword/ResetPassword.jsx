/**
 * @file ResetPassword.jsx
 * @description Reset Password page for the Government Complaint & Schemes Platform.
 *              Accepts a verification OTP, phone number, and a new password.
 *              Prefills the phone number from query parameters, validates inputs,
 *              calls the backend reset password endpoint, and redirects to login.
 */

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  HiShieldCheck,
  HiLockClosed,
  HiEye,
  HiEyeSlash,
  HiArrowRight,
  HiCheckCircle,
  HiPhone,
  HiChatBubbleLeftRight,
} from 'react-icons/hi2';

import api from '../../services/api';
import { passwordRules } from '../../utils/validators';

/* ── Animation Variants ── */
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3 },
  },
};

const successVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const phoneParam = searchParams.get('phone') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      phone: phoneParam,
      otp: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password');

  /* ── Form submission ── */
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password/', {
        phone: data.phone.trim(),
        otp: data.otp.trim(),
        new_password: data.password,
      });

      setIsSuccess(true);
      toast.success('Password reset successfully!');
      
      // Auto-redirect after 3 seconds
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (error) {
      const message =
        error?.response?.data?.otp?.[0] ||
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        'Password reset failed. The OTP may be incorrect or expired.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-12">
      {/* ── Gradient Background ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-gov-900 via-gov-800 to-gov-700" />

      {/* Decorative blobs */}
      <div className="absolute top-1/4 -left-24 w-96 h-96 bg-gov-600/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px]" />

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-md">
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            /* ── Password Reset Form ── */
            <motion.div
              key="form"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="glass-card p-8 md:p-10 bg-white/90 backdrop-blur-xl">
                {/* Header */}
                <div className="flex flex-col items-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gov-600 to-gov-800 flex items-center justify-center shadow-lg shadow-gov-600/25 mb-4">
                    <HiShieldCheck className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-2xl font-extrabold text-gov-900">Reset Password</h1>
                  <p className="text-sm text-gray-500 mt-1 text-center max-w-xs">
                    Enter the OTP code sent to your phone and choose a new secure password.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="form-label">
                      Phone Number
                    </label>
                    <div className="relative">
                      <HiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="phone"
                        type="tel"
                        placeholder="9876543210"
                        readOnly={!!phoneParam}
                        className={`form-input pl-10 ${phoneParam ? 'bg-gray-100/70 border-gray-200 cursor-not-allowed text-gray-500' : ''} ${errors.phone ? 'form-input-error' : ''}`}
                        {...register('phone', {
                          required: 'Phone number is required',
                          pattern: {
                            value: /^(?:\+91)?[6-9]\d{9}$/,
                            message: 'Please enter a valid 10-digit Indian phone number',
                          },
                        })}
                      />
                    </div>
                    {errors.phone && <p className="form-error">{errors.phone.message}</p>}
                  </div>

                  {/* OTP Code */}
                  <div>
                    <label htmlFor="otp" className="form-label">
                      Verification Code (OTP)
                    </label>
                    <div className="relative">
                      <HiChatBubbleLeftRight className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        className={`form-input pl-10 ${errors.otp ? 'form-input-error' : ''}`}
                        {...register('otp', {
                          required: 'Verification code (OTP) is required',
                          pattern: {
                            value: /^\d{6}$/,
                            message: 'OTP must be a 6-digit number',
                          },
                        })}
                      />
                    </div>
                    {errors.otp && <p className="form-error">{errors.otp.message}</p>}
                  </div>

                  {/* New Password */}
                  <div>
                    <label htmlFor="password" className="form-label">
                      New Password
                    </label>
                    <div className="relative">
                      <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        autoComplete="new-password"
                        className={`form-input pl-10 pr-11 ${errors.password ? 'form-input-error' : ''}`}
                        {...register('password', passwordRules)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <HiEyeSlash className="w-5 h-5" />
                        ) : (
                          <HiEye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && <p className="form-error">{errors.password.message}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Re-enter your new password"
                        autoComplete="new-password"
                        className={`form-input pl-10 pr-11 ${errors.confirmPassword ? 'form-input-error' : ''}`}
                        {...register('confirmPassword', {
                          required: 'Please confirm your password',
                          validate: (value) =>
                            value === passwordValue || 'Passwords do not match',
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      >
                        {showConfirm ? (
                          <HiEyeSlash className="w-5 h-5" />
                        ) : (
                          <HiEye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="form-error">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary w-full py-3 text-base cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Resetting…
                      </>
                    ) : (
                      <>
                        Reset Password
                        <HiArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            /* ── Success State ── */
            <motion.div
              key="success"
              variants={successVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="glass-card p-8 md:p-10 bg-white/90 backdrop-blur-xl text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-5">
                  <HiCheckCircle className="w-9 h-9 text-green-500" />
                </div>
                <h2 className="text-2xl font-extrabold text-gov-900 mb-2">Password Updated!</h2>
                <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                  Your password has been reset successfully. You will be redirected to the login page
                  in a few seconds.
                </p>
                <Link to="/login" className="btn btn-primary w-full py-3 text-base cursor-pointer">
                  Sign In Now
                  <HiArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-blue-200/70 hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
