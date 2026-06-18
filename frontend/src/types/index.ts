// ============================================================
// types/index.ts
// Central location for all shared TypeScript types.
// Previously these were scattered as inline `any` casts across
// every page. Centralising them gives you autocomplete, compile-
// time safety, and a single place to update when the API changes.
// ============================================================

// ── Auth ──────────────────────────────────────────────────────
export type UserRole = 'admin' | 'cooperative' | 'farmer';
export type UserStatus = 'active' | 'pending' | 'rejected' | 'suspended';

export interface FarmerProfile {
  cooperative?: { id: string; name: string };
  province?: string;
  district?: string;
  sector?: string;
  farm_size_hectares?: number;
  land_ownership?: string;
  years_of_experience?: number;
  crop_types?: string[];
  farmer_code?: string;
}

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  gender?: string;
  national_id?: string;
  profile_image?: string;
  last_login?: string;
  created_at?: string;
  is_verified?: boolean;
  farmer_profile?: FarmerProfile;
}

// ── Subsidy ───────────────────────────────────────────────────
export type SubsidyStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'disbursed'
  | 'rejected'
  | 'cancelled';

export interface SubsidyApplication {
  id: string;
  status: SubsidyStatus;
  requested_amount: string;
  approved_amount?: string;
  disbursed_amount?: string;
  program?: { id: string; name: string };
  program_name?: string;
  farmer?: { user?: { full_name: string }; farmer_code?: string };
  cooperative?: { name: string };
  reviewed_at?: string;
  disbursement_date?: string;
  rejection_reason?: string;
}

// ── Input / Distribution ──────────────────────────────────────
export interface InputItem {
  id: string;
  name: string;
  category_name?: string;
  unit: string;
  stock_quantity: string;
  minimum_stock: string;
  supplier?: string;
  total_distributed?: string;
  status?: string;
}

export interface Distribution {
  id: string;
  status: string;
  quantity: number;
  distribution_date?: string;
  qr_code?: string;
  created_at: string;
  input?: { name: string; unit: string };
  farmer?: { user?: { full_name: string }; farmer_code?: string };
  input_name?: string;
  unit?: string;
  farmer_name?: string;
  supplier?: string;
}

// ── Cooperative ───────────────────────────────────────────────
export interface Cooperative {
  id: string;
  name: string;
  province?: string;
  district?: string;
  status?: string;
  total_members?: number;
}

// ── Notification ──────────────────────────────────────────────
export interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type?: string;
}

// ── Audit Log ─────────────────────────────────────────────────
export interface AuditLog {
  id?: string;
  user_name?: string;
  action: string;
  created_at: string;
  ip_address?: string;
}

// ── Pagination ────────────────────────────────────────────────
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
