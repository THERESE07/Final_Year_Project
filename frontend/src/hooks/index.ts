// ============================================================
// hooks/index.ts
// Centralized React Query hooks for consistent data fetching.
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  analyticsAPI, notificationsAPI, usersAPI, subsidyAPI,
  cooperativesAPI, inputsAPI,
} from '../api/client';
import { QUERY_KEYS } from '../constants';
import { Notification } from '../types';
import toast from 'react-hot-toast';

const extractData = (response: unknown) => (response as { data?: unknown })?.data;

// ── Public landing stats ──────────────────────────────────────
export function usePublicStats() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.PUBLIC_STATS],
    queryFn: () => analyticsAPI.publicStats(),
    staleTime: 60_000,
  });
  const stats = (extractData(data) as Record<string, unknown>) || {};
  const growth = (stats.growth as Record<string, number>) || {};
  return { stats, growth, isLoading, isError, error, refetch };
}

// ── Admin dashboard ───────────────────────────────────────────
export function useAdminDashboard() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.ADMIN_DASHBOARD],
    queryFn: () => analyticsAPI.adminDashboard(),
    refetchInterval: 30_000,
  });
  const d = extractData(data) as Record<string, unknown> | undefined;
  return {
    stats: (d?.stats as Record<string, number>) ?? {},
    activities: (d?.recent_activities as unknown[]) ?? [],
    lowStock: (d?.low_stock_items as unknown[]) ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
}

export function usePendingUsers(limit = 5) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.PENDING_USERS, limit],
    queryFn: () => usersAPI.getAll({ status: 'pending', limit: String(limit) }),
  });
  return {
    users: ((data as { data?: unknown[] })?.data) ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
}

// ── Farmer dashboard ──────────────────────────────────────────
export function useFarmerDashboard() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.FARMER_DASHBOARD],
    queryFn: () => analyticsAPI.farmerDashboard(),
    refetchInterval: 60_000,
  });
  const d = extractData(data) as Record<string, unknown> | undefined;
  return {
    stats: (d?.stats as Record<string, number>) ?? {},
    distributions: (d?.distributions as unknown[]) ?? [],
    applications: (d?.applications as unknown[]) ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
}

// ── Cooperative dashboard ─────────────────────────────────────
export function useCoopDashboard() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.COOP_DASHBOARD],
    queryFn: () => analyticsAPI.cooperativeDashboard(),
    refetchInterval: 60_000,
  });
  const d = extractData(data) as Record<string, unknown> | undefined;
  return {
    dashboard: d ?? null,
    stats: (d?.stats as Record<string, number>) ?? {},
    cooperative: d?.cooperative,
    farmers: (d?.farmers as unknown[]) ?? [],
    pendingRequests: (d?.pending_requests as unknown[]) ?? [],
    stock: (d?.stock as unknown[]) ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
}

// ── Notifications ─────────────────────────────────────────────
export function useNotifications(limit = 30, tab?: string) {
  const qc = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, limit, tab],
    queryFn: () => notificationsAPI.getAll({ limit }),
  });

  const { data: unreadData } = useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS_UNREAD],
    queryFn: () => notificationsAPI.getUnreadCount(),
    refetchInterval: 30_000,
  });

  const notifications: Notification[] = ((data as { data?: Notification[] })?.data) ?? [];
  const unreadCount = (unreadData as { count?: number })?.count ?? notifications.filter(n => !n.is_read).length;

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsAPI.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS_UNREAD] });
    },
    onError: () => toast.error('Failed to mark notification as read'),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS_UNREAD] });
    },
    onError: () => toast.error('Failed to mark all as read'),
  });

  return { notifications, unreadCount, isLoading, isError, error, refetch, markRead, markAllRead };
}

// ── User management (admin) ───────────────────────────────────
export function useUserApproval() {
  const qc = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      usersAPI.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      const label = status === 'active' ? 'approved' : 'rejected';
      toast.success(`User ${label}`);
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.PENDING_USERS] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_DASHBOARD] });
    },
    onError: () => toast.error('Action failed'),
  });

  return { updateStatus };
}

// ── Cooperatives ──────────────────────────────────────────────
export function useCooperatives(page: number, search: string) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.COOPERATIVES, page, search],
    queryFn: () => cooperativesAPI.getAll({ page, limit: 9, search: search || undefined }),
  });
  return {
    coops: ((data as { data?: unknown[] })?.data) ?? [],
    pagination: (data as { pagination?: unknown })?.pagination,
    isLoading,
    isError,
    error,
    refetch,
  };
}

// ── Inputs catalog ────────────────────────────────────────────
export function useInputsCatalog(page: number, search: string, categoryId: string) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.INPUTS_CATALOG, page, search, categoryId],
    queryFn: () => inputsAPI.getAll({
      page, limit: 9, search: search || undefined, category_id: categoryId || undefined,
    }),
  });
  return {
    inputs: ((data as { data?: unknown[] })?.data) ?? [],
    pagination: (data as { pagination?: unknown })?.pagination,
    isLoading,
    isError,
    error,
    refetch,
  };
}

export function useInputCategories() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.INPUT_CATEGORIES],
    queryFn: () => inputsAPI.getCategories(),
  });
  return {
    categories: (data as unknown[]) ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
}

// ── Subsidy applications ──────────────────────────────────────
export function useSubsidyApplications(page: number, status: string) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.SUBSIDY_APPS_ADMIN, page, status],
    queryFn: () => subsidyAPI.getApplications({ page, limit: 10, status: status || undefined }),
  });
  return {
    applications: ((data as { data?: unknown[] })?.data) ?? [],
    pagination: (data as { pagination?: unknown })?.pagination,
    isLoading,
    isError,
    error,
    refetch,
  };
}

export function useFarmerSubsidies() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.FARMER_SUBSIDIES],
    queryFn: () => subsidyAPI.getApplications({ limit: 20 }),
  });
  const { data: programsData, isLoading: programsLoading } = useQuery({
    queryKey: [QUERY_KEYS.ACTIVE_PROGRAMS],
    queryFn: () => subsidyAPI.getPrograms({ status: 'active', limit: 20 }),
  });
  return {
    applications: ((data as { data?: unknown[] })?.data) ?? [],
    programs: ((programsData as { data?: unknown[] })?.data) ?? [],
    isLoading: isLoading || programsLoading,
    isError,
    error,
    refetch,
  };
}

// ── Distributions ─────────────────────────────────────────────
export function useDistributions(params?: Record<string, unknown>) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.DISTRIBUTIONS, params],
    queryFn: () => inputsAPI.getDistributions(params),
  });
  return {
    distributions: ((data as { data?: unknown[] })?.data) ?? [],
    pagination: (data as { pagination?: unknown })?.pagination,
    isLoading,
    isError,
    error,
    refetch,
  };
}

// ── Analytics extras ──────────────────────────────────────────
export function useSubsidyAnalytics() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.SUBSIDY_ANALYTICS],
    queryFn: () => analyticsAPI.subsidyAnalytics(),
  });
  return { data: extractData(data), isLoading, isError, error, refetch };
}

export function useInventoryStats() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.INVENTORY],
    queryFn: () => analyticsAPI.inventory(),
    refetchInterval: 30_000,
  });
  return { data: extractData(data), isLoading, isError, error, refetch };
}

export function useAuditLogs(limit = 10, enabled = true) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.AUDIT_LOGS, limit],
    queryFn: () => analyticsAPI.auditLogs({ limit }),
    enabled,
  });
  return { logs: (extractData(data) as unknown[]) ?? [], isLoading, isError, error, refetch };
}
