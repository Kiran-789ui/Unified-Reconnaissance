const configuredApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_BASE = !configuredApiUrl || configuredApiUrl === '/api'
  ? '/api'
  : configuredApiUrl.endsWith('/api')
    ? configuredApiUrl
    : `${configuredApiUrl}/api`;

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  let url = `${API_BASE}${endpoint}`;

  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const token = localStorage.getItem('urp_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include HttpOnly cookies
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // response might be text or binary
    }
    const message = errorData.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, errorData);
  }

  return response.json() as Promise<T>;
}

// Download blob files for PDF, CSV, JSON
export async function downloadReportFile(reportId: string, format: 'json' | 'csv' | 'pdf'): Promise<void> {
  const token = localStorage.getItem('urp_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/reports/${reportId}/export?format=${format}`, {
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    let errMessage = 'Download failed';
    try {
      const err = await res.json();
      errMessage = err.message || errMessage;
    } catch {}
    throw new Error(errMessage);
  }

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  let filename = `recon_report_${reportId}.${format}`;
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) filename = match[1];
  }

  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export const api = {
  // Auth
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),
  getMe: () => request<any>('/auth/me', { method: 'GET' }),
  changePassword: (data: any) => request<any>('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),

  // Recon
  fullScan: (target: string) => request<any>('/recon/full', { method: 'POST', body: JSON.stringify({ target }) }),
  domainScan: (target: string) => request<any>('/recon/domain', { method: 'POST', body: JSON.stringify({ target }) }),
  dnsScan: (target: string) => request<any>('/recon/dns', { method: 'POST', body: JSON.stringify({ target }) }),
  whoisScan: (target: string) => request<any>('/recon/whois', { method: 'POST', body: JSON.stringify({ target }) }),
  ipScan: (target: string) => request<any>('/recon/ip', { method: 'POST', body: JSON.stringify({ target }) }),

  // Reports
  getReports: (params?: { page?: number; limit?: number; q?: string; status?: string }) =>
    request<any>('/reports', { method: 'GET', params }),
  getReport: (id: string) => request<any>(`/reports/${id}`, { method: 'GET' }),
  deleteReport: (id: string) => request<any>(`/reports/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboardStats: () => request<any>('/dashboard/stats', { method: 'GET' }),
};
