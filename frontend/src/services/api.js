import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 120 seconds for AI operations (NVIDIA API can be slow)
});

// Request interceptor - Add auth token
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

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    const message = error.response?.data?.error || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updatePassword: (data) => api.put('/auth/password', data),
  deleteAccount: (password) => api.delete('/auth/account', { data: { password } }),
};

// Notes API
export const notesAPI = {
  getAll: (params = {}) => api.get('/notes', { params }),
  getById: (id) => api.get(`/notes/${id}`),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
  togglePin: (id) => api.patch(`/notes/${id}/pin`),
  toggleArchive: (id) => api.patch(`/notes/${id}/archive`),
  getStats: () => api.get('/notes/stats'),
  getCategories: () => api.get('/notes/categories'),
  getTags: () => api.get('/notes/tags'),
};

// AI API
export const aiAPI = {
  ask: (query, topK = 5) => api.post('/ai/ask', { query, topK }),
  summarize: (data) => api.post('/ai/summarize', data),
  generateTitle: (content) => api.post('/ai/generate-title', { content }),
  explain: (content, style = 'simple') => api.post('/ai/explain', { content, style }),
  extractKeyPoints: (data) => api.post('/ai/key-points', data),
  chat: (message, conversationHistory = []) => 
    api.post('/ai/chat', { message, conversationHistory }),
  getInsights: () => api.get('/ai/insights'),
  getRelated: (noteId, limit = 5) => 
    api.get(`/ai/related/${noteId}`, { params: { limit } }),
};

// Search API
export const searchAPI = {
  semantic: (query, limit = 10) => 
    api.get('/search/semantic', { params: { q: query, limit } }),
  keyword: (query, limit = 20, page = 1) => 
    api.get('/search/keyword', { params: { q: query, limit, page } }),
  hybrid: (query, limit = 10, semanticWeight = 0.7) =>
    api.get('/search/hybrid', { params: { q: query, limit, semanticWeight } }),
  suggestions: (query, limit = 5) =>
    api.get('/search/suggestions', { params: { q: query, limit } }),
  reindex: () => api.post('/search/reindex'),
};

export default api;
