/**
 * @file NotFound.jsx
 * @description Beautiful 404 "Page Not Found" page for the Government Complaint
 *              & Schemes Platform. Features a large gradient "404" number, animated
 *              floating geometric shapes, descriptive messaging, and a prominent
 *              "Go Home" button.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiHome,
  HiArrowLeft,
  HiMagnifyingGlass,
} from 'react-icons/hi2';

/* ── Animation Variants ── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-12">
      {/* ── Background ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-gov-50 via-white to-gov-100" />

      {/* ── Animated floating shapes ── */}
      <motion.div
        animate={{ y: [0, -25, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[15%] left-[10%] w-20 h-20 rounded-2xl bg-gov-200/40 blur-sm"
      />
      <motion.div
        animate={{ y: [0, 20, 0], rotate: [0, -8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[25%] right-[12%] w-16 h-16 rounded-full bg-gov-300/30 blur-sm"
      />
      <motion.div
        animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[20%] left-[15%] w-12 h-12 rounded-xl bg-cyan-200/40 blur-sm"
      />
      <motion.div
        animate={{ y: [0, 18, 0], x: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[30%] right-[18%] w-14 h-14 rounded-full bg-gov-400/20 blur-sm"
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, #1e3a5f 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* ── Content ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center max-w-lg mx-auto"
      >
        {/* Large 404 number */}
        <motion.div variants={itemVariants}>
          <h1 className="text-[10rem] sm:text-[12rem] md:text-[14rem] font-black leading-none select-none">
            <span className="bg-gradient-to-br from-gov-700 via-gov-500 to-gov-300 bg-clip-text text-transparent drop-shadow-sm">
              404
            </span>
          </h1>
        </motion.div>

        {/* Search icon */}
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gov-100 -mt-8 mb-6"
        >
          <HiMagnifyingGlass className="w-8 h-8 text-gov-600" />
        </motion.div>

        {/* Heading */}
        <motion.h2
          variants={itemVariants}
          className="text-2xl md:text-3xl font-extrabold text-gov-900 mb-3"
        >
          Page Not Found
        </motion.h2>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="text-gray-500 mb-10 max-w-sm mx-auto leading-relaxed"
        >
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </motion.p>

        {/* Action buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            to="/"
            className="btn btn-primary px-8 py-3 text-base"
          >
            <HiHome className="w-5 h-5" />
            Go Home
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="btn btn-secondary px-8 py-3 text-base"
          >
            <HiArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
