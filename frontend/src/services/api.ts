import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Types
export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  currentCount: number;
  lowStockThreshold: number;
  itemType: 'medicine' | 'kitchen';
  category: string;
  unit: string;
  location?: string;
  notes?: string;
  dosageForm?: string;
  strength?: string;
  expiryDate?: string;
  manufacturer?: string;
  prescriptionRequired?: boolean;
  sideEffects?: string[];
  instructions?: string;
  brand?: string;
  nutritionalInfo?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  type: string;
  severity: string;
  status: string;
  title: string;
  message: string;
  itemId: string;
  itemName: string;
  itemType: string;
  currentCount?: number;
  threshold?: number;
  expiryDate?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Inventory API
export const inventoryApi = {
  // Get all inventory items
  getAll: (params?: { page?: number; limit?: number; type?: string; category?: string }) => {
    return api.get<PaginatedResponse<InventoryItem>>('/api/inventory', { params });
  },

  // Get medicines only
  getMedicines: () => {
    return api.get<ApiResponse<InventoryItem[]>>('/api/inventory/medicines');
  },

  // Get kitchen items only
  getKitchenItems: () => {
    return api.get<ApiResponse<InventoryItem[]>>('/api/inventory/kitchen');
  },

  // Get single item
  getById: (id: string) => {
    return api.get<ApiResponse<InventoryItem>>(`/api/inventory/${id}`);
  },

  // Create new item
  create: (data: Partial<InventoryItem>) => {
    return api.post<ApiResponse<InventoryItem>>('/api/inventory', data);
  },

  // Update item
  update: (id: string, data: Partial<InventoryItem>) => {
    return api.put<ApiResponse<InventoryItem>>(`/api/inventory/${id}`, data);
  },

  // Delete item
  delete: (id: string) => {
    return api.delete<ApiResponse<void>>(`/api/inventory/${id}`);
  },
};

// Alerts API
export const alertsApi = {
  // Get all alerts
  getAll: (params?: { page?: number; limit?: number; status?: string; type?: string }) => {
    return api.get<PaginatedResponse<Alert>>('/api/alerts', { params });
  },

  // Get active alerts
  getActive: () => {
    return api.get<ApiResponse<Alert[]>>('/api/alerts/active');
  },

  // Get single alert
  getById: (id: string) => {
    return api.get<ApiResponse<Alert>>(`/api/alerts/${id}`);
  },

  // Acknowledge alert
  acknowledge: (id: string, data: { acknowledgedBy: string }) => {
    return api.patch<ApiResponse<Alert>>(`/api/alerts/${id}/acknowledge`, data);
  },

  // Resolve alert
  resolve: (id: string, data: { resolvedBy: string }) => {
    return api.patch<ApiResponse<Alert>>(`/api/alerts/${id}/resolve`, data);
  },

  // Dismiss alert
  dismiss: (id: string) => {
    return api.patch<ApiResponse<Alert>>(`/api/alerts/${id}/dismiss`);
  },

  // Subscribe to alerts
  subscribe: (data: { userId: string; alertTypes: string[] }) => {
    return api.post<ApiResponse<any>>('/api/alerts/subscribe', data);
  },
};

// Health API
export const healthApi = {
  // Get health status
  getHealth: () => {
    return api.get<ApiResponse<any>>('/health');
  },

  // Get readiness status
  getReadiness: () => {
    return api.get<ApiResponse<any>>('/health/ready');
  },

  // Get liveness status
  getLiveness: () => {
    return api.get<ApiResponse<any>>('/health/live');
  },
};

export default api; 