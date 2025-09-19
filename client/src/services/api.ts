import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  
  logout: () => api.post('/auth/logout'),
  
  getMe: () => api.get('/auth/me'),
  
  updateProfile: (data: { name?: string; email?: string }) =>
    api.put('/auth/profile', data),
  
  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/updatepassword', data),
};

// PDF API
export const pdfAPI = {
  upload: (formData: FormData) =>
    api.post('/pdfs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    tags?: string;
  }) => api.get('/pdfs', { params }),
  
  getPublic: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    tags?: string;
  }) => api.get('/pdfs/public', { params }),
  
  getById: (id: string) => api.get(`/pdfs/${id}`),
  
  getFile: (id: string) => api.get(`/pdfs/${id}/file`, {
    responseType: 'blob',
  }),
  
  update: (id: string, data: {
    title?: string;
    description?: string;
    tags?: string[];
    isPublic?: boolean;
  }) => api.put(`/pdfs/${id}`, data),
  
  delete: (id: string) => api.delete(`/pdfs/${id}`),
};

// Annotation API
export const annotationAPI = {
  create: (data: {
    pdfId: string;
    page: number;
    type: string;
    content: any;
    isPrivate?: boolean;
    tags?: string[];
  }) => api.post('/annotations', data),
  
  getByPDF: (pdfId: string, params?: {
    page?: number;
    type?: string;
    isResolved?: boolean;
  }) => api.get(`/annotations/pdf/${pdfId}`, { params }),
  
  getMy: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    isResolved?: boolean;
  }) => api.get('/annotations/my', { params }),
  
  update: (id: string, data: {
    content?: any;
    isPrivate?: boolean;
    isResolved?: boolean;
    tags?: string[];
  }) => api.put(`/annotations/${id}`, data),
  
  delete: (id: string) => api.delete(`/annotations/${id}`),
  
  addReply: (id: string, data: { text: string }) =>
    api.post(`/annotations/${id}/replies`, data),
  
  deleteReply: (id: string, replyId: string) =>
    api.delete(`/annotations/${id}/replies/${replyId}`),
};

export default api;