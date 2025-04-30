import axios from 'axios';
import { API_URLS } from '@/common/urls';

const client = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

function getRefreshToken() {
  return localStorage.getItem('refresh');
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    console.error('No refresh token found. Please log in again.');
    window.location.href = '/login';
    return null;
  }

  try {
    const response = await client.post(API_URLS.REFRESH_TOKEN, { refresh: refreshToken });
    const { access } = response.data;
    localStorage.setItem('token', access);
    return access;
  } catch (error) {
    localStorage.clear();
    window.location.href = '/login';
    return null;
  }
}

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        error.config.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return client(error.config); // retry request
      }
    }
    return Promise.reject(error);
  }
);

export default client;
