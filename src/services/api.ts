const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Bilinmeyen hata' }));
    throw new Error(error.error || 'İşlem başarısız');
  }
  return response.json();
}

export const apiService = {
  // Fabrikalar
  getFactories: () => fetchAPI('/factories'),
  createFactory: (data: any) => fetchAPI('/factories', { method: 'POST', body: JSON.stringify(data) }),
  updateFactory: (id: string, data: any) => fetchAPI(`/factories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFactory: (id: string) => fetchAPI(`/factories/${id}`, { method: 'DELETE' }),

  // Okumalar
  getReadings: () => fetchAPI('/readings'),
  createReading: (data: any) => fetchAPI('/readings', { method: 'POST', body: JSON.stringify(data) }),
  updateReading: (id: string, data: any) => fetchAPI(`/readings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReading: (id: string) => fetchAPI(`/readings/${id}`, { method: 'DELETE' }),

  // Faturalar
  getInvoices: () => fetchAPI('/invoices'),
  createInvoice: (data: any) => fetchAPI('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  updateInvoice: (id: string, data: any) => fetchAPI(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Kullanıcılar
  getUsers: () => fetchAPI('/users'),
  createUser: (data: any) => fetchAPI('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) => fetchAPI(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: string) => fetchAPI(`/users/${id}`, { method: 'DELETE' }),

  // Ayarlar
  getSettings: () => fetchAPI('/settings'),
  updateSettings: (id: string, data: any) => fetchAPI(`/settings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Loglar
  getLogs: () => fetchAPI('/logs'),
  createLog: (data: any) => fetchAPI('/logs', { method: 'POST', body: JSON.stringify(data) }),
  clearLogs: () => fetchAPI('/logs', { method: 'DELETE' }),

  // Bildirimler
  getNotifications: () => fetchAPI('/notifications'),
  createNotification: (data: any) => fetchAPI('/notifications', { method: 'POST', body: JSON.stringify(data) }),
  deleteNotification: (id: string) => fetchAPI(`/notifications/${id}`, { method: 'DELETE' }),
};
