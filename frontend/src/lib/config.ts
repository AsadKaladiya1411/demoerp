const rawApiUrl = import.meta.env.VITE_API_URL || '';

export const apiBase = rawApiUrl.replace(/\/$/, '');

export function getApiBase() {
  if (!apiBase) {
    throw new Error('VITE_API_URL is not configured');
  }
  return apiBase;
}
