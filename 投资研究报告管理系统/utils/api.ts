import { projectId, publicAnonKey } from './supabase/info';
import type { Company, Report, Comment } from '../App';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-78971119`;

const createAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
});

const createFormHeaders = () => ({
  'Authorization': `Bearer ${publicAnonKey}`,
});

// Cache management
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (url: string, params?: any) => {
  return params ? `${url}_${JSON.stringify(params)}` : url;
};

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

const clearCachePattern = (pattern: string) => {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

const makeRequest = async function<T>(
  url: string, 
  options: RequestInit = {},
  cacheKey?: string
): Promise<T> {
  // Check cache first for GET requests
  if (cacheKey && (!options.method || options.method === 'GET')) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Deduplicate identical requests
  const requestKey = `${url}_${JSON.stringify(options)}`;
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey);
  }

  const request = fetch(url, options).then(async (response) => {
    pendingRequests.delete(requestKey);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'API request failed');
    }
    
    // Cache successful GET responses
    if (cacheKey && (!options.method || options.method === 'GET')) {
      setCachedData(cacheKey, result.data);
    }
    
    return result.data;
  }).catch(error => {
    pendingRequests.delete(requestKey);
    throw error;
  });

  pendingRequests.set(requestKey, request);
  return request;
};

export const companyApi = {
  async getAll(): Promise<Company[]> {
    const cacheKey = getCacheKey('companies_getAll');
    return makeRequest<Company[]>(`${API_BASE_URL}/companies`, {
      headers: createAuthHeaders(),
    }, cacheKey);
  },

  async getById(id: string): Promise<Company> {
    const cacheKey = getCacheKey('companies_getById', { id });
    return makeRequest<Company>(`${API_BASE_URL}/companies/${id}`, {
      headers: createAuthHeaders(),
    }, cacheKey);
  },

  async create(data: Partial<Company>): Promise<Company> {
    clearCachePattern('companies');
    return makeRequest<Company>(`${API_BASE_URL}/companies`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<Company>): Promise<Company> {
    clearCachePattern('companies');
    return makeRequest<Company>(`${API_BASE_URL}/companies/${id}`, {
      method: 'PUT',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    clearCachePattern('companies');
    clearCachePattern(`reports_${id}`);
    return makeRequest<void>(`${API_BASE_URL}/companies/${id}`, {
      method: 'DELETE',
      headers: createAuthHeaders(),
    });
  },

  async updateOrder(orderUpdates: { id: string; order: number }[]): Promise<void> {
    clearCachePattern('companies');
    return makeRequest<void>(`${API_BASE_URL}/companies/reorder`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify({ orderUpdates }),
    });
  },

  async uploadIcon(id: string, file: File): Promise<Company> {
    clearCachePattern('companies');
    const formData = new FormData();
    formData.append('icon', file);
    
    return makeRequest<Company>(`${API_BASE_URL}/companies/${id}/icon`, {
      method: 'POST',
      headers: createFormHeaders(),
      body: formData,
    });
  },
};

export const reportApi = {
  async getByCompany(companyId: string): Promise<Report[]> {
    const cacheKey = getCacheKey('reports_getByCompany', { companyId });
    return makeRequest<Report[]>(`${API_BASE_URL}/companies/${companyId}/reports`, {
      headers: createAuthHeaders(),
    }, cacheKey);
  },

  async upload(companyId: string, data: {
    title: string;
    analyst: string;
    category: string;
    file: File;
  }): Promise<Report> {
    clearCachePattern(`reports_${companyId}`);
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('analyst', data.analyst);
    formData.append('category', data.category);
    formData.append('file', data.file);
    
    return makeRequest<Report>(`${API_BASE_URL}/companies/${companyId}/reports`, {
      method: 'POST',
      headers: createFormHeaders(),
      body: formData,
    });
  },

  async update(companyId: string, reportId: string, data: {
    title: string;
    analyst: string;
    category: string;
    createdAt?: string;
  }): Promise<Report> {
    clearCachePattern(`reports_${companyId}`);
    return makeRequest<Report>(`${API_BASE_URL}/reports/${companyId}/${reportId}`, {
      method: 'PUT',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });
  },

  async updateOrder(companyId: string, orderUpdates: { id: string; order: number }[]): Promise<void> {
    clearCachePattern(`reports_${companyId}`);
    return makeRequest<void>(`${API_BASE_URL}/companies/${companyId}/reports/reorder`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify({ orderUpdates }),
    });
  },

  async delete(companyId: string, reportId: string): Promise<void> {
    clearCachePattern(`reports_${companyId}`);
    return makeRequest<void>(`${API_BASE_URL}/reports/${companyId}/${reportId}`, {
      method: 'DELETE',
      headers: createAuthHeaders(),
    });
  },

  async getDownloadUrl(companyId: string, reportId: string): Promise<string> {
    const result = await makeRequest<{ downloadUrl: string }>(`${API_BASE_URL}/reports/${companyId}/${reportId}/download`, {
      headers: createAuthHeaders(),
    });
    return result.downloadUrl;
  },
};

export const commentApi = {
  async getByReport(companyId: string, reportId: string): Promise<Comment[]> {
    const cacheKey = getCacheKey('comments_getByReport', { companyId, reportId });
    return makeRequest<Comment[]>(`${API_BASE_URL}/reports/${companyId}/${reportId}/comments`, {
      headers: createAuthHeaders(),
    }, cacheKey);
  },

  async create(companyId: string, reportId: string, content: string): Promise<Comment> {
    clearCachePattern(`comments_${companyId}_${reportId}`);
    clearCachePattern(`reports_${companyId}`);
    return makeRequest<Comment>(`${API_BASE_URL}/reports/${companyId}/${reportId}/comments`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify({ content }),
    });
  },

  async update(companyId: string, reportId: string, commentId: string, content: string): Promise<Comment> {
    clearCachePattern(`comments_${companyId}_${reportId}`);
    clearCachePattern(`reports_${companyId}`);
    return makeRequest<Comment>(`${API_BASE_URL}/comments/${companyId}/${reportId}/${commentId}`, {
      method: 'PUT',
      headers: createAuthHeaders(),
      body: JSON.stringify({ content }),
    });
  },

  async delete(companyId: string, reportId: string, commentId: string): Promise<void> {
    clearCachePattern(`comments_${companyId}_${reportId}`);
    clearCachePattern(`reports_${companyId}`);
    return makeRequest<void>(`${API_BASE_URL}/comments/${companyId}/${reportId}/${commentId}`, {
      method: 'DELETE',
      headers: createAuthHeaders(),
    });
  },
};

// Initialize sample data
export const initSampleData = async (): Promise<void> => {
  try {
    return makeRequest<void>(`${API_BASE_URL}/init-sample-data`, {
      method: 'POST',
      headers: createAuthHeaders(),
    });
  } catch (error) {
    console.error('Failed to initialize sample data:', error);
    throw error;
  }
};