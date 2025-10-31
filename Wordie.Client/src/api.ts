import axios from 'axios';
import type { PagedRequest, PagedResponse, WordDto, WordSetDto, LoginRequest, RegisterRequest, AuthResponse } from './types';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const wordsApi = {
  query: async (request: PagedRequest): Promise<PagedResponse<WordDto>> => {
    const response = await api.post('/words/query', request);
    return response.data as PagedResponse<WordDto>;
  },

  get: async (id: string): Promise<WordDto> => {
    const response = await api.get(`/words/${id}`);
    return response.data as WordDto;
  },

  create: async (data: { term: string; definition: string; level: number; wordSetId?: string }): Promise<WordDto> => {
    const response = await api.post('/words', data);
    return response.data as WordDto;
  },

  update: async (id: string, data: { term: string; definition: string; level: number; wordSetId?: string }): Promise<void> => {
    await api.put(`/words/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/words/${id}`);
  },
};

export const wordSetsApi = {
  getAll: async (): Promise<WordSetDto[]> => {
    const response = await api.get('/wordsets');
    return response.data as WordSetDto[];
  },

  query: async (request: PagedRequest): Promise<PagedResponse<WordSetDto>> => {
    const response = await api.post('/wordsets/query', request);
    return response.data as PagedResponse<WordSetDto>;
  },

  get: async (id: string): Promise<WordSetDto> => {
    const response = await api.get(`/wordsets/${id}`);
    return response.data as WordSetDto;
  },

  create: async (data: { title: string; description?: string }): Promise<WordSetDto> => {
    const response = await api.post('/wordsets', data);
    return response.data as WordSetDto;
  },

  update: async (id: string, data: { title: string; description?: string }): Promise<void> => {
    await api.put(`/wordsets/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/wordsets/${id}`);
  },

  getWords: async (id: string, request: PagedRequest): Promise<PagedResponse<WordDto>> => {
    const response = await api.post(`/wordsets/${id}/words/query`, request);
    return response.data as PagedResponse<WordDto>;
  },

  createAndReturn: async (data: { title: string; description?: string }): Promise<WordSetDto> => {
    const response = await api.post('/wordsets', data);
    return response.data as WordSetDto;
  },
  
  updateAndReturn: async (id: string, data: { title: string; description?: string }): Promise<WordSetDto> => {
    const response = await api.put(`/wordsets/${id}`, data);
    return response.data as WordSetDto;
  },
};

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<void> => {
    await api.post('/auth/register', userData);
  },
};