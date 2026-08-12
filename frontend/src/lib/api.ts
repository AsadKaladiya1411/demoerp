import axios from 'axios';
import { apiBase } from './config';

export { apiBase };

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
  const authorization = getAuthHeader().Authorization;
  if (authorization) config.headers.set('Authorization', authorization);
  else config.headers.delete('Authorization');
  return config;
});

export default api;
