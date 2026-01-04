import axios from 'axios';
import { getIdToken } from './firebase';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'Error de conexión';
    return Promise.reject(new Error(message));
  }
);

export default api;

// Auth API
export const authApi = {
  login: (idToken: string, userType?: string) =>
    api.post('/auth/login', { idToken, userType }),
  getMe: () => api.get('/auth/me'),
  updateMe: (data: { name?: string; phone?: string }) =>
    api.patch('/auth/me', data),
  deleteAccount: (downloadData: boolean) =>
    api.delete(`/auth/me?downloadData=${downloadData}`),
};

// Pulperia API
export const pulperiaApi = {
  getAll: (params?: { lat?: number; lng?: number; radius?: number; search?: string }) =>
    api.get('/pulperias', { params }),
  getOne: (id: string) => api.get(`/pulperias/${id}`),
  create: (data: FormData) =>
    api.post('/pulperias', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) =>
    api.patch(`/pulperias/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string, downloadData: boolean) =>
    api.delete(`/pulperias/${id}?downloadData=${downloadData}`),
  getShareLinks: (id: string) => api.get(`/pulperias/${id}/share`),
};

// Product API
export const productApi = {
  getAll: (params?: { pulperiaId?: string; category?: string; search?: string }) =>
    api.get('/products', { params }),
  getOne: (id: string) => api.get(`/products/${id}`),
  create: (data: FormData) =>
    api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) =>
    api.patch(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Order API
export const orderApi = {
  getMyOrders: () => api.get('/orders/my-orders'),
  getPulperiaOrders: (params?: { status?: string; from?: string; to?: string }) =>
    api.get('/orders/pulperia-orders', { params }),
  getOne: (id: string) => api.get(`/orders/${id}`),
  create: (data: { items: { productId: string; quantity: number }[]; customerPhone: string; customerNote?: string }) =>
    api.post('/orders', data),
  accept: (id: string) => api.post(`/orders/${id}/accept`),
  ready: (id: string) => api.post(`/orders/${id}/ready`),
  delivered: (id: string) => api.post(`/orders/${id}/delivered`),
  cancel: (id: string, reason?: string) => api.post(`/orders/${id}/cancel`, { reason }),
};

// Review API
export const reviewApi = {
  getForPulperia: (pulperiaId: string, page?: number) =>
    api.get(`/reviews/pulperia/${pulperiaId}`, { params: { page } }),
  create: (pulperiaId: string, data: { rating: number; comment?: string }) =>
    api.post(`/reviews/pulperia/${pulperiaId}`, data),
  delete: (id: string) => api.delete(`/reviews/${id}`),
};

// Job API
export const jobApi = {
  getAll: (params?: { search?: string; pulperiaId?: string }) =>
    api.get('/jobs', { params }),
  getMyJobs: () => api.get('/jobs/my-jobs'),
  getMyApplications: () => api.get('/jobs/my-applications'),
  getOne: (id: string) => api.get(`/jobs/${id}`),
  create: (data: { title: string; description: string; salary?: string }) =>
    api.post('/jobs', data),
  update: (id: string, data: { title?: string; description?: string; salary?: string; isActive?: boolean }) =>
    api.patch(`/jobs/${id}`, data),
  delete: (id: string) => api.delete(`/jobs/${id}`),
  apply: (id: string, data: FormData) =>
    api.post(`/jobs/${id}/apply`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  respond: (id: string, data: { status: 'ACCEPTED' | 'REJECTED'; response?: string }) =>
    api.post(`/jobs/applications/${id}/respond`, data),
};

// Catalog API
export const catalogApi = {
  getAll: (params?: { profession?: string; search?: string }) =>
    api.get('/catalog', { params }),
  getMyCatalogs: () => api.get('/catalog/my-catalogs'),
  getByUser: (userId: string) => api.get(`/catalog/user/${userId}`),
  getOne: (id: string) => api.get(`/catalog/${id}`),
  create: (data: { profession: string; description?: string }) =>
    api.post('/catalog', data),
  update: (id: string, data: { description?: string }) =>
    api.patch(`/catalog/${id}`, data),
  delete: (id: string) => api.delete(`/catalog/${id}`),
  addImage: (catalogId: string, data: FormData) =>
    api.post(`/catalog/${catalogId}/images`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteImage: (catalogId: string, imageId: string) =>
    api.delete(`/catalog/${catalogId}/images/${imageId}`),
};

// Notification API
export const notificationApi = {
  getVapidKey: () => api.get('/notifications/vapid-key'),
  subscribe: (subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
    api.post('/notifications/subscribe', subscription),
  unsubscribe: (endpoint: string) =>
    api.post('/notifications/unsubscribe', { endpoint }),
};

// Stats API
export const statsApi = {
  getPulperiaStats: (params?: { from?: string; to?: string }) =>
    api.get('/stats/pulperia', { params }),
  exportData: (type: 'orders' | 'products' | 'reviews', format: 'json' | 'csv', params?: { from?: string; to?: string }) =>
    api.get('/stats/export', { params: { type, format, ...params }, responseType: format === 'csv' ? 'blob' : 'json' }),
};
