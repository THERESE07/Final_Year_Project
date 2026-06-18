// ============================================================
// constants/index.ts
// All hardcoded string arrays and config values in one place.
//
// WHY: Previously CROP_TYPES, PROVINCES, STEPS, chart colors,
// status maps, and route paths were duplicated or inlined across
// RegisterPage.tsx, AdminPages.tsx, FarmerDashboard.tsx, etc.
// Any change required hunting through multiple files.
// ============================================================

// ── Agriculture domain constants ──────────────────────────────
export const CROP_TYPES = [
  'Maize', 'Rice', 'Beans', 'Wheat', 'Coffee',
  'Tea', 'Cassava', 'Potatoes', 'Vegetables', 'Sorghum',
] as const;

export const PROVINCES = [
  'Kigali', 'Northern', 'Southern', 'Eastern', 'Western',
] as const;

export const LAND_OWNERSHIP_TYPES = [
  'Owned', 'Leased', 'Community', 'Government',
] as const;

export const REGISTRATION_STEPS = [
  'Personal Info', 'Location', 'Farm Details', 'Security',
] as const;

// ── Status badge CSS classes ───────────────────────────────────
// Used by FarmerDashboard, SubsidyAllocation, UserApproval, etc.
// Previously each page defined its own version of this mapping.
export const STATUS_BADGE: Record<string, string> = {
  pending_coop_approval: 'bg-orange-100 text-orange-700',
  pending_admin_approval:'bg-purple-100 text-purple-700',
  active:       'bg-green-100 text-green-700',
  approved:     'bg-blue-100 text-blue-700',
  disbursed:    'bg-green-100 text-green-700',
  distributed:  'bg-green-100 text-green-700',
  pending:      'bg-yellow-100 text-yellow-700',
  under_review: 'bg-purple-100 text-purple-700',
  rejected:     'bg-red-100 text-red-700',
  cancelled:    'bg-gray-100 text-gray-500',
  suspended:    'bg-gray-100 text-gray-500',
};

// ── Chart colors ───────────────────────────────────────────────
// Previously hardcoded inline in AnalyticsReports
export const CHART_COLORS = [
  '#2d6a4f', '#40916c', '#74c69d', '#95d5b2', '#b7e4c7',
];

// ── App routes ─────────────────────────────────────────────────
// Centralising routes prevents typos and makes refactoring easier.
export const ROUTES = {
  HOME:    '/',
  LOGIN:   '/login',
  REGISTER: '/register',

  ADMIN: {
    ROOT:            '/admin',
    USER_APPROVAL:   '/admin/user-approval',
    COOPERATIVES:    '/admin/cooperative-management',
    BENEFICIARIES:   '/admin/beneficiary-database',
    INPUT_CATALOG:   '/admin/input-catalog',
    INPUT_DIST:      '/admin/input-distribution',
    DIST_SCHEDULE:   '/admin/distribution-schedule',
    DIST_RECEIPT:    '/admin/distribution-receipt',
    RETURNS:         '/admin/returns-complaints',
    INVENTORY:       '/admin/inventory-warehouse',
    SUBSIDY_ALLOC:   '/admin/subsidy-allocation',
    ANALYTICS:       '/admin/analytics-reports',
    FIELD_DATA:      '/admin/field-data-collection',
    EXPORT:          '/admin/export-reports',
    SECURITY:        '/admin/security-monitoring',
    SETTINGS:        '/admin/system-settings',
  },

  FARMER: {
    ROOT:          '/farmer',
    INPUTS:        '/farmer/inputs',
    INPUT_REQUESTS:'/farmer/input-requests',
    SUBSIDIES:     '/farmer/subsidies',
    SECURITY:      '/farmer/security',
    NOTIFICATIONS: '/farmer/notifications',
    PROFILE:       '/farmer/profile',
  },

  COOPERATIVE: {
    ROOT:          '/cooperative',
    FARMERS:       '/cooperative/farmers',
    PENDING_FARMERS:'/cooperative/pending-farmers',
    INPUTS:        '/cooperative/inputs',
    INPUT_REQUESTS:'/cooperative/input-requests',
    REPORTS:       '/cooperative/reports',
    SECURITY:      '/cooperative/security',
    NOTIFICATIONS: '/cooperative/notifications',
    PROFILE:       '/cooperative/profile',
  },
} as const;

// ── Query cache keys ───────────────────────────────────────────
// Prevents string typos in useQuery / invalidateQueries calls.
export const QUERY_KEYS = {
  PUBLIC_STATS:             'public-stats',
  ADMIN_DASHBOARD:          'admin-dashboard',
  FARMER_DASHBOARD:         'farmer-dashboard',
  COOP_DASHBOARD:           'cooperative-dashboard',
  SUBSIDY_APPS_ADMIN:       'subsidy-applications-admin',
  SUBSIDY_ANALYTICS:        'subsidy-analytics',
  PENDING_USERS:            'pending-users',
  INVENTORY:                'inventory-warehouse',
  AUDIT_LOGS:               'audit-logs',
  NOTIFICATIONS:            'notifications',
  NOTIFICATIONS_UNREAD:     'notifications-unread',
  DISTRIBUTIONS:            'distributions',
  COOPERATIVES:             'cooperatives',
  INPUTS_CATALOG:           'inputs-catalog',
  INPUT_CATEGORIES:         'input-categories',
  FARMER_SUBSIDIES:         'farmer-subsidies',
  INPUT_REQUESTS:           'input-requests',
  PENDING_FARMERS:          'pending-farmers',
  ACTIVE_PROGRAMS:          'active-programs',
  REPORT_DISTRIBUTIONS:     'report-distributions',
  REPORT_SUBSIDIES:         'report-subsidies',
} as const;

// ── App meta ───────────────────────────────────────────────────
export const APP_NAME = 'AgriSubsidy System';
export const APP_ORG  = 'AGRIFOP';
export const APP_LOCATION = 'Kigali, Rwanda';
export const CURRENT_SEASON = '2025B';
export const SEASON_END = 'March 2026';
