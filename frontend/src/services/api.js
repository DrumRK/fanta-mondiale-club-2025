import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  }
};