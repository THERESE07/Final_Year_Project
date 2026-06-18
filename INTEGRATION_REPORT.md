# AgriSubsidy Integration Audit Report

**Project:** `agrisubsidy-refactored` (frontend + backend)  
**Date:** June 9, 2026  
**Scope:** Full-stack synchronization audit and integration fixes

---

## Executive Summary

The AgriSubsidy platform has a solid backend API layer and a feature-rich frontend. This audit connected the landing page to live database statistics, added FK validation for input distributions, introduced Zod validation on both tiers, standardized React Query hooks, and improved loading/error handling—without changing the existing UI design.

---

## 1. Fully Working Features

| Feature | Frontend Route | Backend API | Status |
|---------|---------------|-------------|--------|
| **Landing page live stats** | `/` | `GET /analytics/public` | ✅ Fixed — now fetches real DB stats |
| **User registration** | `/register` | `POST /auth/register` | ✅ Saves to PostgreSQL (`users` + `farmers`), Zod validated |
| **Login & JWT auth** | `/login` | `POST /auth/login` | ✅ Working |
| **Refresh token flow** | Axios interceptor | `POST /auth/refresh` | ✅ Auto-refresh on 401 |
| **Protected routes** | `App.tsx` Guard | JWT middleware | ✅ Role-based redirects |
| **Change password** | Security pages | `PUT /auth/change-password` | ✅ Fixed (was POST, now PUT) |
| **Admin dashboard** | `/admin` | `GET /analytics/admin` | ✅ Real data + query invalidation |
| **Farmer dashboard** | `/farmer` | `GET /analytics/farmer` | ✅ Real data via hooks |
| **Cooperative dashboard** | `/cooperative` | `GET /analytics/cooperative` | ✅ Real data via hooks |
| **User approval (CRU status)** | `/admin/user-approval` | `GET/PATCH /users` | ✅ Approve/reject with notifications |
| **Cooperative CRU** | `/admin/cooperative-management` | `GET/POST/PUT /cooperatives` | ✅ Create, edit, view farmers |
| **Cooperative profile update** | `/cooperative/profile` | `PUT /cooperatives/:id` | ✅ Working |
| **Input catalog (CR)** | `/admin/input-catalog` | `GET/POST /inputs` | ✅ Create + list |
| **Input categories (R)** | Input catalog dropdown | `GET /inputs/categories` | ✅ Read working |
| **Input distributions (CR + approve)** | `/cooperative/inputs`, `/admin/input-distribution` | `GET/POST/PATCH /distributions` | ✅ FK validation added |
| **Subsidy applications (CR + review + disburse)** | Farmer + admin pages | `/subsidies/applications/*` | ✅ Working |
| **Subsidy programs (R)** | Farmer apply modal | `GET /subsidies/programs` | ✅ Working |
| **Notifications (R + mark read)** | Farmer/coop notifications | `/notifications/*` | ✅ Working |
| **Inventory warehouse** | `/admin/inventory-warehouse` | `GET /analytics/inventory` | ✅ Working |
| **Analytics reports** | `/admin/analytics-reports` | `/analytics/admin`, `/subsidy-analytics` | ✅ Working |
| **Audit logs** | Security/settings pages | `GET /analytics/audit-logs` | ✅ Working |
| **Beneficiary database** | Admin + coop routes | Users API / coop dashboard | ✅ Working |
| **Distribution schedule/receipt** | Admin pages | `GET /distributions` | ✅ Working |

---

## 2. Partially Connected Features

| Feature | Issue | Recommendation |
|---------|-------|----------------|
| **Input catalog update** | Backend `PUT /inputs/:id` exists; UI has no edit button | Add edit modal (logic exists in orphan `pages/InputsPage.tsx`) |
| **Input categories create** | Backend `POST /inputs/categories` exists; no admin UI | Add category management modal in Input Catalog |
| **Subsidy programs CRU** | Backend CRUD exists; only read in farmer UI | Add admin program management page or modal |
| **Users full CRUD** | Only status update exposed; orphan `UsersPage.tsx` has more | Wire admin user list or remove orphan page |
| **Reports export** | Preview uses real API data; export is toast-only | Add backend export endpoint (CSV/PDF) |
| **Field data collection** | UI placeholder only | Requires mobile/offline API (not in scope) |
| **Returns & complaints** | Toast-only submit | Requires new backend entity |
| **Distribution reject** | Reject button has no API | Add `PATCH /distributions/:id/reject` |
| **Profile update (farmer)** | Read from dashboard; save was stub | Add `PUT /auth/profile` or user update endpoint |
| **System settings** | Audit tab uses API; other tabs are static | Settings persistence needs backend config API |
| **Security monitoring** | Mix of audit logs + static session data | Session management API not implemented |
| **Notification preferences** | UI only, not persisted | Add user preferences endpoint |
| **Admin analytics performance %** | Hardcoded 94.5%, 90.3%, 87.8% in AdminPages | Compute from audit/application metrics or remove |
| **QR receipt generation** | Client-side pixel pattern | Could use distribution `qr_code` from API |

---

## 3. Broken Features (Fixed During Audit)

| Issue | Root Cause | Fix Applied |
|-------|-----------|-------------|
| Landing page stats hardcoded | No public analytics endpoint | Added `GET /analytics/public` + React Query hook |
| Change password failing | Frontend used POST, backend expects PUT | Fixed `authAPI.changePassword` to use PUT |
| Admin approve/reject not refreshing | No query invalidation | `useUserApproval` hook invalidates caches |
| Input distribution FK errors | No farmer/cooperative validation | Added entity checks in `InputService.createDistribution` |
| Hooks unused | Pages duplicated inline queries | Migrated key pages to `hooks/index.ts` |
| No request validation | Zod installed but unused | Added backend middleware + frontend schemas |

---

## 4. Backend Endpoints Not Used in Frontend

| Method | Endpoint | Notes |
|--------|----------|-------|
| `POST` | `/inputs/categories` | No create-category UI |
| `PUT` | `/inputs/:id` | No edit input UI in routed pages |
| `GET` | `/inputs/low-stock` | Data surfaced via admin dashboard instead |
| `POST` | `/subsidies/programs` | Only in orphan SubsidiesPage |
| `PUT` | `/subsidies/programs/:id` | Unused in active routes |
| `GET` | `/notifications/unread-count` | Frontend computes from list instead |
| `POST` | `/auth/logout` with refresh token | Called on logout ✅ |
| `auditLog` middleware | Defined but never applied | Consider wiring to mutating routes |

---

## 5. Frontend UI Without Backend Integration

| Page / Feature | Route | Gap |
|----------------|-------|-----|
| Field Data Collection | `/admin/field-data-collection` | No backend |
| Returns & Complaints | `/admin/returns-complaints` | No backend |
| Report PDF/Excel export | Reports pages | No export API |
| System Settings (non-audit tabs) | `/admin/system-settings` | No config API |
| Session timeout settings | Security pages | No persistence |
| Notification preferences | Notifications page | No preferences API |
| Distribution reject | Coop dashboard | No reject endpoint |
| Orphan pages in `pages/*` | Not routed | Legacy duplicates |

---

## 6. Auth & Registration Verification

### Registration flow
1. `POST /auth/register` → validates with Zod
2. Creates `User` with `status: 'pending'`
3. For farmers: creates `Farmer` profile, optionally links/creates cooperative
4. Password hashed via Sequelize `beforeCreate` hook

### Failure points
| Failure | HTTP | Cause |
|---------|------|-------|
| Duplicate email/phone/national ID | 409 | Uniqueness check in AuthService |
| Invalid payload | 400 | Zod validation middleware |
| Login before approval | 401 | Status check rejects pending users |
| Expired refresh token | 401 | Redirect to login |

### Auth flow
- Access token: 15 min (JWT)
- Refresh token: 7 days (DB stored, rotated on refresh)
- Protected routes: `authenticate` + `authorize(role)` middleware

---

## 7. CRUD Matrix

| Entity | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| **Users** | Register only | ✅ Admin list | ✅ Status only | ❌ No delete |
| **Cooperatives** | ✅ | ✅ | ✅ | ❌ |
| **Agricultural Inputs** | ✅ | ✅ | ⚠️ API only | ❌ Soft via `is_active` |
| **Input Categories** | ⚠️ API only | ✅ | ❌ | ❌ |
| **Subsidy Programs** | ⚠️ API only | ✅ | ⚠️ API only | ❌ |
| **Subsidy Applications** | ✅ Farmer | ✅ | ✅ Review/disburse | ❌ |
| **Input Distributions** | ✅ | ✅ | ✅ Approve | ❌ |
| **Notifications** | ✅ System-generated | ✅ | ✅ Mark read | ❌ |

---

## 8. Changes Implemented

### Backend
- `GET /api/v1/analytics/public` — public landing page statistics from PostgreSQL
- FK validation in `InputService.createDistribution` for `farmer_id` and `cooperative_id`
- Zod validation middleware on auth, users, cooperatives, inputs, distributions, subsidies routes
- Schemas in `backend/src/validation/schemas.ts`

### Frontend
- Landing page connected to public analytics API
- `authAPI.changePassword` fixed to PUT
- Centralized React Query hooks in `hooks/index.ts`
- `QueryErrorBanner` component for consistent error UX
- Zod payload schemas in `utils/schemas.ts`
- Pages migrated to hooks: Landing, AdminDashboard, FarmerDashboard, CoopDashboard, Notifications, FarmerSubsidies, Reports, CooperativeManagement
- CooperativeManagement: edit + view farmers wired to API

---

## 9. Recommended Improvements (Priority Order)

1. **Add distribution reject endpoint** — complete cooperative approval workflow
2. **Wire input update UI** — reuse logic from orphan InputsPage in InputCatalog
3. **Add subsidy program admin UI** — create/edit programs from admin panel
4. **Add category create UI** — small modal in Input Catalog
5. **Profile update endpoint** — replace farmer profile save stub
6. **Report export API** — CSV generation for distributions/applications
7. **Apply audit middleware** — use existing `auditLog()` on mutating routes
8. **Remove or consolidate orphan `pages/*`** — reduce duplication with `features/*`
9. **Use `GET /notifications/unread-count`** — for navbar badge efficiency
10. **Field data & complaints modules** — new backend entities if required by product roadmap

---

## 10. Test Plan Checklist

- [ ] Register new farmer → verify row in `users` and `farmers` tables (status=pending)
- [ ] Admin approves user → status=active, notification created
- [ ] Login as farmer/cooperative/admin → correct dashboard redirect
- [ ] Landing page shows live counts matching admin dashboard totals
- [ ] Create distribution with invalid farmer_id → 400 error
- [ ] Create distribution with valid IDs → pending status, stock not deducted until approve
- [ ] Approve distribution → stock deducted, farmer notified
- [ ] Farmer applies for subsidy → appears in admin subsidy allocation
- [ ] Admin reviews/disburse → farmer dashboard updates
- [ ] Change password → success with PUT request
- [ ] Token refresh after 15 min → seamless retry without logout
- [ ] Cooperative edit saves → reflected in coop profile

---

*Report generated after full-stack integration audit. UI design preserved; changes focused on API connectivity, validation, and data fetching consistency.*
