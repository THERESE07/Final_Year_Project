// ============================================================
// components/common/index.tsx
// Small, reusable presentational components used across ALL
// features (admin, farmer, cooperative).
//
// WHY these were extracted:
//
//  • StatCard — identical "icon + label + value" card appeared
//    in AdminDashboard, FarmerDashboard, SecurityPage, and
//    InventoryWarehouse with copy-pasted markup. One component
//    now serves all of them.
//
//  • FormField — the <Field> helper was defined INSIDE the
//    RegisterPage render function, causing cursor loss on every
//    keystroke (a bug you already debugged). Moving it here
//    fixes that permanently because the component reference is
//    stable across renders.
//
//  • StatusBadge — status-to-CSS mapping was duplicated in
//    FarmerDashboard, SubsidyAllocation, UserApproval, and
//    InputDistribution. Now centralised.
//
//  • PageHeader — the <h1 class="page-title"> + <p> subtitle
//    pattern was repeated on every single page.
//
//  • LoadingRows — skeleton row pattern repeated in every table.
//
//  • EmptyState — "no data yet" pattern appeared ~10 times.
//
//  • Loader — the full-screen spinner was inlined in App.tsx.
// ============================================================

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { getStatusBadge } from '../../utils';
import { APP_NAME, APP_ORG } from '../../constants';

// ── StatCard ──────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;   // e.g. 'text-agri-green'
  iconBg: string;      // e.g. 'bg-green-100'
  /** Optional sub-line below the value */
  sub?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label, value, icon: Icon, iconColor, iconBg, sub
}) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
      <Icon size={22} className={iconColor} />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  </div>
);

// ── MiniStatCard ── used in grids with just a value + label ───
interface MiniStatCardProps {
  label: string;
  value: string | number;
  valueColor?: string; // e.g. 'text-agri-green'
}

export const MiniStatCard: React.FC<MiniStatCardProps> = ({
  label, value, valueColor = 'text-gray-900'
}) => (
  <div className="card">
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
  </div>
);

// ── StatusBadge ───────────────────────────────────────────────
interface StatusBadgeProps {
  status: string;
  /** If true, display text is capitalised (e.g. "Pending") */
  capitalise?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, capitalise = true }) => (
  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadge(status)}`}>
    {capitalise ? status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ') : status}
  </span>
);

// ── FormField ─────────────────────────────────────────────────
// IMPORTANT: This was previously defined *inside* RegisterPage's
// render function. Defining components inside render causes React
// to treat them as new component types on every render, destroying
// DOM focus (cursor loss bug). Always define them outside.
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
    {error && (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
        <AlertCircle size={11} /> {error}
      </p>
    )}
  </div>
);

// ── PageHeader ────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between">
    <div>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

// ── LoadingRows ───────────────────────────────────────────────
interface LoadingRowsProps {
  rows?: number;
  cols: number;
}

export const LoadingRows: React.FC<LoadingRowsProps> = ({ rows = 5, cols }) => (
  <>
    {Array(rows).fill(0).map((_, i) => (
      <tr key={i}>
        {Array(cols).fill(0).map((_, j) => (
          <td key={j} className="table-td">
            <div className="h-4 bg-gray-100 rounded animate-pulse" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

// ── EmptyState ────────────────────────────────────────────────
interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  sub?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon, message, sub, action
}) => (
  <div className="text-center py-12">
    <Icon size={32} className="mx-auto mb-2 text-gray-300" />
    <p className="text-gray-400 text-sm">{message}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ── PaginationBar ─────────────────────────────────────────────
interface PaginationBarProps {
  page: number;
  total: number;
  showing: number;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  page, total, showing, hasNext, onPrev, onNext
}) => (
  <div className="px-5 py-4 border-t flex items-center justify-between text-sm">
    <p className="text-gray-400">{showing} of {total}</p>
    <div className="flex gap-2">
      <button
        disabled={page === 1}
        onClick={onPrev}
        className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
      >
        Prev
      </button>
      <button
        disabled={!hasNext}
        onClick={onNext}
        className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
      >
        Next
      </button>
    </div>
  </div>
);

// ── FullPageLoader ────────────────────────────────────────────
// Extracted from App.tsx inline JSX — now importable anywhere.
export const FullPageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-green-50">
    <div className="text-center">
      <div className="w-16 h-16 bg-agri-green rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>
      <p className="text-agri-green font-semibold">{APP_NAME}</p>
      <p className="text-gray-400 text-sm">{APP_ORG} · Kigali, Rwanda</p>
    </div>
  </div>
);

// ── QueryErrorBanner ──────────────────────────────────────────
interface QueryErrorBannerProps {
  message?: string;
  onRetry?: () => void;
}

export const QueryErrorBanner: React.FC<QueryErrorBannerProps> = ({
  message = 'Failed to load data. Please try again.',
  onRetry,
}) => (
  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-3">
    <p className="text-sm text-red-700">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="text-xs font-medium text-red-700 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-100"
      >
        Retry
      </button>
    )}
  </div>
);

// ── SpinnerButton ─────────────────────────────────────────────
// Loading state for submit buttons — used in Login, Register, etc.
interface SpinnerButtonProps {
  loading: boolean;
  label: string;
  loadingLabel?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const SpinnerButton: React.FC<SpinnerButtonProps> = ({
  loading, label, loadingLabel = 'Loading...', onClick, className = 'btn-primary', disabled
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading || disabled}
    className={`${className} disabled:opacity-50`}
  >
    {loading ? (
      <span className="flex items-center justify-center gap-2">
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        {loadingLabel}
      </span>
    ) : label}
  </button>
);
