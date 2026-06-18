// ============================================================
// types/index.ts
// Shared TypeScript interfaces for the entire backend.
//
// AuthRequest is defined in middleware/auth.ts (the source of truth).
// We re-export it here as AuthenticatedRequest so controllers
// can import from one consistent place.
// ============================================================

import { Request } from 'express';

// Re-export the middleware auth type under a consistent name
export type { AuthRequest as AuthenticatedRequest } from '../middleware/auth';

// ── Pagination ────────────────────────────────────────────────
export interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ── Registration ──────────────────────────────────────────────
export interface RegisterPayload {
  full_name: string;
  national_id: string;
  email: string;
  phone: string;
  gender?: string;
  role: 'farmer' | 'cooperative';
  password: string;
  cooperative_name?: string;
  province?: string;
  district?: string;
  sector?: string;
  farm_size_hectares?: number;
  land_ownership?: string;
  years_of_experience?: number;
  crop_types?: string[];
}

// ── Login ─────────────────────────────────────────────────────
export interface LoginPayload {
  email?: string;
  phone?: string;
  password?: string;
  pin?: string;
  login_method?: 'email' | 'mobile';
}

// ── User queries ──────────────────────────────────────────────
export interface UserQuery extends PaginationQuery {
  role?: string;
  status?: string;
  search?: string;
}

// ── Cooperative queries ───────────────────────────────────────
export interface CooperativeQuery extends PaginationQuery {
  search?: string;
  province?: string;
}

// ── Subsidy queries ───────────────────────────────────────────
export interface SubsidyAppQuery extends PaginationQuery {
  status?: string;
  program_id?: string;
}

// ── Input queries ─────────────────────────────────────────────
export interface InputQuery extends PaginationQuery {
  search?: string;
  category_id?: string;
  season?: string;
}

// ── Distribution queries ──────────────────────────────────────
export interface DistributionQuery extends PaginationQuery {
  status?: string;
  season?: string;
}
