import axios from 'axios';

export const apiBase = ((import.meta as ImportMeta & { env: Record<string, string | undefined> }).env?.VITE_API_URL || '').replace(/\/$/, '');

export function getAuthHeader() {
  try {
    const raw = window.localStorage.getItem('jolly_auth_user') || '';
    const obj = raw ? JSON.parse(raw) : null;
    const token = obj?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export const api = axios.create({ baseURL: apiBase });

api.interceptors.request.use(config => {
  config.headers.set('Authorization', getAuthHeader().Authorization);
  if (!getAuthHeader().Authorization) config.headers.delete('Authorization');
  return config;
});

export default api;
