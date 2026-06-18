// ============================================================
// utils/index.ts
// Pure helper functions used across multiple pages.
//
// WHY: timeAgo() was copy-pasted in FarmerDashboard and
// NotificationsPage. formatCurrency() logic was inlined
// everywhere with slightly different rounding. Centralising
// them means one fix applies everywhere.
// ============================================================

import { STATUS_BADGE } from '../constants';

/**
 * Returns a human-readable "time ago" string.
 * e.g. "5m ago", "3h ago", "2d ago"
 */
export function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * Returns the Tailwind badge class for a given status string.
 * Falls back to a neutral grey if the status is unknown.
 */
export function getStatusBadge(status: string): string {
  return STATUS_BADGE[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-600';
}

/**
 * Format a number as RWF currency with optional shorthand (K/M/B).
 * formatCurrency(1_500_000)       → "RWF 1.5M"
 * formatCurrency(75_000)          → "RWF 75K"
 * formatCurrency(500, false)      → "RWF 500"
 */
export function formatCurrency(
  amount: number | string,
  shorten = true
): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(n)) return 'RWF 0';
  if (shorten) {
    if (n >= 1_000_000_000) return `RWF ${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000)     return `RWF ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)         return `RWF ${(n / 1_000).toFixed(0)}K`;
  }
  return `RWF ${n.toLocaleString()}`;
}

/**
 * Capitalise the first letter of each word.
 * e.g. "cooperative_leader" → "Cooperative Leader"
 */
export function titleCase(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Build a query string from a params object, omitting empty values.
 * Previously duplicated as `qs()` inside api/client.ts — keeping
 * it in utils makes it reusable for non-API uses too.
 */
export function buildQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  );
  const qs = new URLSearchParams(filtered).toString();
  return qs ? `?${qs}` : '';
}
