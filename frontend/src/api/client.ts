/// <reference types="vite/client" />
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private refreshing = false;
  private queue: Array<(token: string) => void> = [];

  constructor() {
    this.client = axios.create({ baseURL: BASE_URL, headers: { 'Content-Type': 'application/json' }, timeout: 30000 });
    this.client.interceptors.request.use(cfg => {
      const t = localStorage.getItem('access_token');
      if (t) cfg.headers.Authorization = `Bearer ${t}`;
      return cfg;
    });
    this.client.interceptors.response.use(r => r, async err => {
      const orig = err.config;
      if (err.response?.status === 401 && !orig._retry) {
        if (this.refreshing) return new Promise(res => this.queue.push(t => { orig.headers.Authorization = `Bearer ${t}`; res(this.client(orig)); }));
        orig._retry = true; this.refreshing = true;
        try {
          const rt = localStorage.getItem('refresh_token');
          if (!rt) throw new Error('No refresh token');
          const r2 = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: rt });
          const { access_token, refresh_token: newRt } = r2.data.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', newRt);
          this.queue.forEach(cb => cb(access_token)); this.queue = []; this.refreshing = false;
          orig.headers.Authorization = `Bearer ${access_token}`;
          return this.client(orig);
        } catch { this.refreshing = false; this.queue = []; localStorage.clear(); window.location.href = '/login'; return Promise.reject(err); }
      }
      return Promise.reject(err);
    });
  }

  async getRaw(url: string, config?: AxiosRequestConfig) { const r = await this.client.get(url, config); return r.data; }
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> { const r = await this.client.get(url, config); return r.data.data; }
  async post<T>(url: string, data?: any): Promise<{ data: T; message: string }> { const r = await this.client.post(url, data); return { data: r.data.data, message: r.data.message }; }
  async put<T>(url: string, data?: any): Promise<T> { const r = await this.client.put(url, data); return r.data.data; }
  async patch<T>(url: string, data?: any): Promise<T> { const r = await this.client.patch(url, data); return r.data.data; }
  async delete<T>(url: string): Promise<T> { const r = await this.client.delete(url); return r.data.data; }
}

export const api = new ApiClient();

const qs = (params?: any) => params ? '?' + new URLSearchParams(
  Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== '')) as Record<string, string>
).toString() : '';

export const authAPI = {
  login: (d: any) => api.post('/auth/login', d),
  register: (d: any) => api.post('/auth/register', d),
  registerWithDocuments: async (formData: FormData) => {
    const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
    const r = await fetch(`${BASE_URL}/auth/register`, { method: 'POST', body: formData });
    const json = await r.json();
    if (!r.ok) throw { response: { data: json } };
    return { data: json.data, message: json.message };
  },
  getRegistrationCooperatives: () => api.get('/auth/cooperatives'),
  logout: (rt: string) => api.post('/auth/logout', { refresh_token: rt }),
  refresh: (t: string) => api.post('/auth/refresh', { refresh_token: t }),
  profile: () => api.get('/auth/profile'),
  changePassword: (d: any) => api.put('/auth/change-password', d),
};

export const analyticsAPI = {
  publicStats: () => api.getRaw('/analytics/public'),
  adminDashboard: () => api.getRaw('/analytics/admin'),
  farmerDashboard: () => api.getRaw('/analytics/farmer'),
  cooperativeDashboard: () => api.getRaw('/analytics/cooperative'),
  getBeneficiaries: (p?: any) => api.getRaw(`/analytics/beneficiaries${qs(p)}`),
  subsidyAnalytics: () => api.getRaw('/analytics/subsidy-analytics'),
  inventory: () => api.getRaw('/analytics/inventory'),
  auditLogs: (p?: any) => api.getRaw(`/analytics/audit-logs${qs(p)}`),
};

export const usersAPI = {
  getAll: (p?: any) => api.getRaw(`/users${qs(p)}`),
  getById: (id: string) => api.get(`/users/${id}`),
  getApprovalStats: () => api.get('/users/approval-stats'),
  updateStatus: (id: string, status: string, feedback?: string) => api.patch(`/users/${id}/status`, { status, feedback }),
  review: (id: string, d: { action: 'approve' | 'reject'; feedback?: string }) => api.patch(`/users/${id}/review`, d),
};

export const cooperativesAPI = {
  getAll: (p?: any) => api.getRaw(`/cooperatives${qs(p)}`),
  getStats: () => api.get('/cooperatives/stats'),
  create: (d: any) => api.post('/cooperatives', d),
  update: (id: string, d: any) => api.put(`/cooperatives/${id}`, d),
  getFarmers: (id: string) => api.get(`/cooperatives/${id}/farmers`),
  getPendingFarmers: (p?: any) => api.getRaw(`/cooperatives/pending-farmers${qs(p)}`),
  getPendingFarmersCount: () => api.get<{ count: number }>('/cooperatives/pending-farmers/count'),
  reviewFarmer: (userId: string, d: { action: 'approve' | 'reject'; feedback?: string }) =>
    api.patch(`/cooperatives/farmers/${userId}/review`, d),
};

export const inputRequestsAPI = {
  getAll: (p?: any) => api.getRaw(`/input-requests${qs(p)}`),
  create: (d: any) => api.post('/input-requests', d),
  review: (id: string, d: { action: 'approve' | 'reject'; feedback: string; quantity?: number }) =>
    api.patch(`/input-requests/${id}/review`, d),
  getPendingCount: () => api.get<{ count: number }>('/input-requests/pending-count'),
};

export const subsidyAPI = {
  getPrograms: (p?: any) => api.getRaw(`/subsidies/programs${qs(p)}`),
  createProgram: (d: any) => api.post('/subsidies/programs', d),
  updateProgram: (id: string, d: any) => api.put(`/subsidies/programs/${id}`, d),
  getApplications: (p?: any) => api.getRaw(`/subsidies/applications${qs(p)}`),
  apply: (d: any) => api.post('/subsidies/applications', d),
  review: (id: string, d: any) => api.patch(`/subsidies/applications/${id}/review`, d),
  disburse: (id: string, d: any) => api.patch(`/subsidies/applications/${id}/disburse`, d),
};

export const allocationsAPI = {
  getInventory: () => api.get('/allocations/inventory'),
  getAllocations: (p?: any) => api.getRaw(`/allocations/allocations${qs(p)}`),
  createAllocation: (d: { cooperative_id: string; input_id: string; quantity: number; notes: string }) =>
    api.post('/allocations/allocations', d),
  getRequests: (p?: any) => api.getRaw(`/allocations/requests${qs(p)}`),
  createRequest: (d: any) => api.post('/allocations/requests', d),
  reviewRequest: (id: string, d: { action: 'approve' | 'reject'; feedback: string; quantity?: number }) =>
    api.patch(`/allocations/requests/${id}/review`, d),
};

export const inputsAPI = {
  getAll: (p?: any) => api.getRaw(`/inputs${qs(p)}`),
  create: (d: any) => api.post('/inputs', d),
  update: (id: string, d: any) => api.put(`/inputs/${id}`, d),
  getCategories: () => api.get('/inputs/categories'),
  createCategory: (d: any) => api.post('/inputs/categories', d),
  getLowStock: () => api.get('/inputs/low-stock'),
  getDistributions: (p?: any) => api.getRaw(`/distributions${qs(p)}`),
  getDistributionFarmers: () => api.get('/distributions/farmers'),
  createDistribution: (d: any) => api.post('/distributions', d),
  approveDistribution: (id: string) => api.patch(`/distributions/${id}/approve`, {}),
};

export const notificationsAPI = {
  getAll: (p?: any) => api.getRaw(`/notifications${qs(p)}`),
  getUnreadCount: () => api.get<{count:number}>('/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`, {}),
  markAllRead: () => api.patch('/notifications/mark-all-read', {}),
};
