import axios from 'axios';
import { API_URLS } from '@/common/urls';
import { isStandalone } from '@/utils/isStandalone';

const client = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise = null;

function getRefreshToken() {
  return localStorage.getItem('refresh');
}

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      console.error('No refresh token found. Please log in again.');
      window.location.href = '/login';
      return null;
    }

    try {
      const response = await client.post(API_URLS.REFRESH_TOKEN, { refresh: refreshToken });
      const { access, refresh } = response.data;
      localStorage.setItem('token', access);
      if (refresh) {
        localStorage.setItem('refresh', refresh);
      }
      return access;
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
      window.location.href = '/login';
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (isStandalone()) {
    config.headers['X-Client-Mode'] = 'standalone';
  }
  return config;
});

const AUTH_ENDPOINTS_SKIP_REFRESH = [API_URLS.LOGIN, API_URLS.REGISTER, API_URLS.REFRESH_TOKEN];

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';
    const isAuthEndpoint = AUTH_ENDPOINTS_SKIP_REFRESH.some((endpoint) => requestUrl.includes(endpoint));

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        error.config.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return client(originalRequest);
      }
    }
    return Promise.reject(error);
  },
);

export default client;
