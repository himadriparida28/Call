/**
 * LoadingSpinner.jsx
 * ------------------
 * A simple, accessible loading indicator.
 *
 * Props:
 *   size       – 'sm' | 'md' | 'lg'  (default 'md')
 *   fullScreen – boolean              (centers in the viewport)
 *   className  – additional classes
 */
import { motion } from 'framer-motion';

const sizeMap = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
};

export default function LoadingSpinner({ size = 'md', fullScreen = false, className = '' }) {
  const spinner = (
    <motion.div
      className={`rounded-full border-gov-200 border-t-gov-600 animate-spin ${sizeMap[size]} ${className}`}
      role="status"
      aria-label="Loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    />
  );

  /* Full-screen variant – fixed overlay that covers the viewport */
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  /* Inline variant – simple flexbox centering */
  return (
    <div className="flex items-center justify-center py-12">
      {spinner}
    </div>
  );
}
