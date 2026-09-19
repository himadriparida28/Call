/**
 * EmptyState.jsx
 * ---------------
 * A friendly placeholder displayed when a list or section has no data.
 *
 * Props:
 *   icon          – React element (e.g. <HiDocumentText />)
 *   title         – heading text
 *   description   – secondary description text
 *   actionLabel   – optional CTA button label
 *   onAction      – optional click handler for the CTA
 */
import { motion } from 'framer-motion';

export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      {/* Muted icon circle */}
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gov-50 text-gov-400 text-3xl">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>

      {/* Description */}
      {description && (
        <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      )}

      {/* Optional CTA button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn btn-primary mt-6"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
