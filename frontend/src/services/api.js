import axios from 'axios';

// 🎯 CONFIGURAZIONE CENTRALIZZATA - CAMBIA SOLO QUESTO URL!
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://fanta-mondiale-club-2025-production.up.railway.app/api'  // PRODUZIONE
  : 'http://localhost:3001/api';                                        // SVILUPPO

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 📊 Request/Response Interceptors per debug e logging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.response?.status || 'Network'} ${error.config?.url}`);
    return Promise.reject(error);
  }
);

// API endpoints
export const apiService = {
  // Get current standings/classifica
  getClassifica: async () => {
    try {
      const response = await api.get('/classifica');
      return response.data;
    } catch (error) {
      console.error('Error fetching classifica:', error);
      throw error;
    }
  },

  // Get today's matches
  getIncontriOggi: async () => {
    try {
      const response = await api.get('/incontri');
      return response.data;
    } catch (error) {
      console.error('Error fetching incontri:', error);
      throw error;
    }
  },

  // Get all future matches (calendario)
  getCalendario: async () => {
    try {
      const response = await api.get('/calendario');
      return response.data;
    } catch (error) {
      console.error('Error fetching calendario:', error);
      throw error;
    }
  },

  // Get all players and their teams
  getSquadre: async () => {
    try {
      const response = await api.get('/squadre');
      return response.data;
    } catch (error) {
      console.error('Error fetching squadre:', error);
      throw error;
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  // 🔧 Admin endpoints (se servono)
  getAdminStatus: async () => {
    try {
      const response = await api.get('/admin/status');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin status:', error);
      throw error;
    }
  },

  updateMatches: async () => {
    try {
      const response = await api.post('/admin/update-matches');
      return response.data;
    } catch (error) {
      console.error('Error updating matches:', error);
      throw error;
    }
  }
};

// 🌐 Export dell'URL base per uso esterno se necessario
export const getApiBaseUrl = () => API_BASE_URL;

// 📋 Export dell'istanza axios per usi custom
export const apiClient = api;

export default apiService;