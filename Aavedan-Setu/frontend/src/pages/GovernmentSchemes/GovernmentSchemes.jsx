/**
 * GovernmentSchemes.jsx
 * =====================
 * Schemes listing page — browse all government schemes with
 * search, department/state/category filters, a responsive card
 * grid, pagination, loading skeletons, and an empty-state view.
 *
 * Design tokens come from the global design-system CSS
 * (gov-50…gov-900, accent, surface, etc.) and utility classes
 * (.card, .card-hover, .btn, .badge, .form-input, .skeleton …).
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiMagnifyingGlass,
  HiAdjustmentsHorizontal,
  HiFunnel,
  HiChevronLeft,
  HiChevronRight,
  HiBuildingOffice2,
  HiMapPin,
  HiArrowTopRightOnSquare,
  HiInboxStack,
  HiXMark,
} from 'react-icons/hi2';

import { useSchemes } from '../../hooks/useSchemes';
import { truncateText } from '../../utils/helpers';
import { departments, indianStates } from '../../utils/helpers';

/* ──────────────── Constants ──────────────── */

/** Scheme category options shown in the filter dropdown */
const CATEGORIES = [
  'Education',
  'Health',
  'Agriculture',
  'Housing',
  'Employment',
  'Finance',
  'Social Welfare',
  'Technology',
  'Infrastructure',
  'Other',
];

/** How many cards per page */
const PAGE_SIZE = 12;

/** Debounce delay for the search input (ms) */
const DEBOUNCE_MS = 400;

/* ──────────────── Helpers ──────────────── */

/**
 * Custom debounce hook — returns a debounced version of a
 * callback that waits `delay` ms before executing.
 */
function useDebouncedCallback(callback, delay) {
  const timerRef = React.useRef(null);

  return useCallback(
    (...args) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  );
}

/* ──────────────── Sub-components ──────────────── */

/** A single skeleton card shown while data is loading */
const SkeletonCard = () => (
  <div className="card p-6 space-y-4 animate-pulse">
    {/* Title skeleton */}
    <div className="skeleton h-5 w-3/4 rounded" />
    {/* Badge skeleton */}
    <div className="skeleton h-4 w-1/3 rounded-full" />
    {/* Description lines */}
    <div className="space-y-2">
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-5/6 rounded" />
      <div className="skeleton h-3 w-2/3 rounded" />
    </div>
    {/* Footer skeleton */}
    <div className="flex items-center justify-between pt-2">
      <div className="skeleton h-4 w-1/4 rounded" />
      <div className="skeleton h-8 w-24 rounded-lg" />
    </div>
  </div>
);

/** Grid of skeleton cards — mirrors the real card grid layout */
const LoadingGrid = ({ count = PAGE_SIZE }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

/** Empty state — no schemes found */
const EmptyState = ({ hasFilters, onClear }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-20 text-center"
  >
    <div className="w-20 h-20 rounded-full bg-gov-100 flex items-center justify-center mb-5">
      <HiInboxStack className="w-10 h-10 text-gov-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-800 mb-1">
      {hasFilters ? 'No schemes match your filters' : 'No schemes available'}
    </h3>
    <p className="text-sm text-gray-500 max-w-sm">
      {hasFilters
        ? 'Try adjusting your search or filter criteria to find relevant government schemes.'
        : 'Government schemes will appear here once they are published.'}
    </p>
    {hasFilters && (
      <button onClick={onClear} className="btn btn-secondary mt-6">
        <HiXMark className="w-4 h-4" />
        Clear Filters
      </button>
    )}
  </motion.div>
);

/** Error state */
const ErrorState = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-20 text-center"
  >
    <div className="w-20 h-20 rounded-full bg-danger-light flex items-center justify-center mb-5">
      <HiXMark className="w-10 h-10 text-danger" />
    </div>
    <h3 className="text-lg font-semibold text-gray-800 mb-1">Something went wrong</h3>
    <p className="text-sm text-gray-500 max-w-sm">
      {message || 'We could not load government schemes. Please try again later.'}
    </p>
  </motion.div>
);

/* ──────────────── Card animation variants ──────────────── */
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: 'easeOut' },
  }),
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

/* ──────────────── SchemeCard ──────────────── */
const SchemeCard = ({ scheme, index }) => (
  <motion.div
    custom={index}
    variants={cardVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    layout
    className="card card-hover flex flex-col overflow-hidden"
  >
    {/* Card body */}
    <div className="p-5 flex flex-col flex-1">
      {/* Title */}
      <h3 className="text-base font-bold text-gov-800 mb-2 leading-snug line-clamp-2">
        {scheme.scheme_name || scheme.title || scheme.name}
      </h3>

      {/* Department badge */}
      {scheme.department && (
        <span className="badge badge-review self-start mb-3 text-[11px]">
          <HiBuildingOffice2 className="w-3.5 h-3.5 mr-1" />
          {scheme.department?.name || scheme.department}
        </span>
      )}

      {/* Description */}
      <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-4">
        {truncateText(scheme.description, 120)}
      </p>

      {/* Region */}
      {scheme.state && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
          <HiMapPin className="w-3.5 h-3.5" />
          {scheme.state}
        </div>
      )}

      {/* Footer */}
      <Link
        to={`/schemes/${scheme.id}`}
        className="btn btn-primary w-full text-sm justify-center mt-auto"
      >
        View Details
        <HiArrowTopRightOnSquare className="w-3.5 h-3.5" />
      </Link>
    </div>
  </motion.div>
);

/* ──────────────── Pagination ──────────────── */
const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  /** Build a compact page-number array with ellipses */
  const pages = useMemo(() => {
    const items = [];
    const delta = 1; // neighbours around current page

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= page - delta && i <= page + delta)
      ) {
        items.push(i);
      } else if (items[items.length - 1] !== '…') {
        items.push('…');
      }
    }
    return items;
  }, [page, totalPages]);

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-10" aria-label="Pagination">
      {/* Previous */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="btn btn-ghost px-2"
        aria-label="Previous page"
      >
        <HiChevronLeft className="w-5 h-5" />
      </button>

      {/* Page numbers */}
      {pages.map((p, idx) =>
        p === '…' ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`btn min-w-[36px] h-9 text-sm ${
              p === page
                ? 'btn-primary shadow-none'
                : 'btn-ghost'
            }`}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="btn btn-ghost px-2"
        aria-label="Next page"
      >
        <HiChevronRight className="w-5 h-5" />
      </button>
    </nav>
  );
};

/* ════════════════════════════════════════════════
   ███  GovernmentSchemes — Main Page Component  ███
   ════════════════════════════════════════════════ */
const GovernmentSchemes = () => {
  /* ---------- State ---------- */
  const [searchInput, setSearchInput] = useState('');   // instant UI value
  const [searchQuery, setSearchQuery] = useState('');    // debounced API value
  const [department, setDepartment] = useState('');
  const [state, setState] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  /* Build query params sent to the hook */
  const params = useMemo(
    () => ({
      search: searchQuery || undefined,
      department: department || undefined,
      state: state || undefined,
      category: category || undefined,
      page,
      page_size: PAGE_SIZE,
    }),
    [searchQuery, department, state, category, page]
  );

  /* Fetch schemes */
  const { data, isLoading, error } = useSchemes(params);

  const schemes = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  /* ---------- Handlers ---------- */

  /** Debounced search — waits DEBOUNCE_MS before updating the query */
  const applySearch = useCallback((value) => {
    setSearchQuery(value);
    setPage(1); // reset to first page when searching
  }, []);

  const debouncedSearch = useDebouncedCallback(applySearch, DEBOUNCE_MS);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  /** When any filter dropdown changes, reset to page 1 */
  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  /** True if any filter / search is active */
  const hasFilters = !!(searchQuery || department || state || category);

  /** Clear every filter */
  const clearFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setDepartment('');
    setState('');
    setCategory('');
    setPage(1);
  };

  /* ---------- Render ---------- */
  return (
    <div className="page-container">
      {/* ── Page Header ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="page-title gradient-text text-2xl md:text-3xl">
          Government Schemes
        </h1>
        <p className="page-subtitle mt-1">
          Discover and explore government schemes across departments and states.
        </p>
      </motion.div>

      {/* ── Search & Filters ───────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        className="glass-card p-4 md:p-5 mb-8"
      >
        {/* Search bar */}
        <div className="relative mb-4">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search schemes by name, description, or keyword…"
            className="form-input pl-10"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Department */}
          <div>
            <label className="form-label flex items-center gap-1">
              <HiBuildingOffice2 className="w-3.5 h-3.5 text-gov-500" />
              Department
            </label>
            <select
              value={department}
              onChange={handleFilterChange(setDepartment)}
              className="form-input"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* State */}
          <div>
            <label className="form-label flex items-center gap-1">
              <HiMapPin className="w-3.5 h-3.5 text-gov-500" />
              State
            </label>
            <select
              value={state}
              onChange={handleFilterChange(setState)}
              className="form-input"
            >
              <option value="">All States</option>
              {indianStates.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="form-label flex items-center gap-1">
              <HiFunnel className="w-3.5 h-3.5 text-gov-500" />
              Category
            </label>
            <select
              value={category}
              onChange={handleFilterChange(setCategory)}
              className="form-input"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filter indicator / clear button */}
        {hasFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200"
          >
            <p className="text-xs text-gray-500">
              <HiAdjustmentsHorizontal className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
              Showing filtered results
              {totalCount > 0 && (
                <span className="ml-1 font-semibold text-gov-700">
                  ({totalCount} scheme{totalCount !== 1 ? 's' : ''})
                </span>
              )}
            </p>
            <button onClick={clearFilters} className="btn btn-ghost text-xs py-1 px-2">
              <HiXMark className="w-3.5 h-3.5" />
              Clear all
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* ── Content Area ───────────────────────── */}
      {isLoading ? (
        <LoadingGrid />
      ) : error ? (
        <ErrorState message={error?.message} />
      ) : schemes.length === 0 ? (
        <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
      ) : (
        <>
          {/* Results count */}
          <p className="text-sm text-gray-500 mb-5">
            Showing{' '}
            <span className="font-semibold text-gov-700">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)}
            </span>{' '}
            of <span className="font-semibold text-gov-700">{totalCount}</span> schemes
          </p>

          {/* Card grid */}
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {schemes.map((scheme, i) => (
                <SchemeCard key={scheme.id} scheme={scheme} index={i} />
              ))}
            </div>
          </AnimatePresence>

          {/* Pagination */}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default GovernmentSchemes;
