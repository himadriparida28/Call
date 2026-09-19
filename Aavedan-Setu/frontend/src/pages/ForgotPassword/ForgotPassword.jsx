/**
 * @file ForgotPassword.jsx
 * @description Forgot Password page for the Government Complaint & Schemes Platform.
 *              Allows users to enter their registered phone number to request a
 *              password reset verification code (OTP).
 *              Redirects to the reset password page upon successful verification.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  HiShieldCheck,
  HiPhone,
  HiArrowRight,
  HiCheckCircle,
  HiArrowLeft,
} from 'react-icons/hi2';

import api from '../../services/api';

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

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedPhone, setSubmittedPhone] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { phone: '' },
  });

  /* ── Form submission ── */
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const phoneClean = data.phone.trim();
      const res = await api.post('/auth/forgot-password/', { phone: phoneClean });
      
      setSubmittedPhone(phoneClean);
      setIsSuccess(true);
      toast.success(res.data?.message || 'Verification OTP sent to your phone.');
      
      // Redirect to reset password page automatically with the phone number
      setTimeout(() => {
        navigate(`/reset-password?phone=${encodeURIComponent(phoneClean)}`);
      }, 4000);
    } catch (error) {
      const message =
        error?.response?.data?.phone?.[0] ||
        error?.response?.data?.message ||
        'Failed to verify phone number. Ensure it is registered.';
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
            /* ── Phone Form ── */
            <motion.div
              key="form"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="glass-card p-8 md:p-10 bg-white/90 backdrop-blur-xl">
                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gov-600 to-gov-800 flex items-center justify-center shadow-lg shadow-gov-600/25 mb-4">
                    <HiShieldCheck className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-2xl font-extrabold text-gov-900">Forgot Password?</h1>
                  <p className="text-sm text-gray-500 mt-1 text-center max-w-xs">
                    Enter your registered phone number and we will send you an OTP to reset your password.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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
                        autoComplete="tel"
                        className={`form-input pl-10 ${errors.phone ? 'form-input-error' : ''}`}
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

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary w-full py-3 text-base cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Requesting OTP…
                      </>
                    ) : (
                      <>
                        Send Reset OTP
                        <HiArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Back to login */}
                <div className="mt-6 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gov-600 hover:text-gov-700 transition-colors"
                  >
                    <HiArrowLeft className="w-4 h-4" />
                    Back to Sign In
                  </Link>
                </div>
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
                <h2 className="text-2xl font-extrabold text-gov-900 mb-2">OTP Sent!</h2>
                <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                  We've sent a password reset OTP to{' '}
                  <span className="font-semibold text-gov-800">{submittedPhone}</span>.
                  You will be automatically redirected to enter your new password.
                </p>

                <button
                  onClick={() => navigate(`/reset-password?phone=${encodeURIComponent(submittedPhone)}`)}
                  className="btn btn-primary w-full py-3 text-base cursor-pointer"
                >
                  Proceed to Reset
                  <HiArrowRight className="w-5 h-5" />
                </button>
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
