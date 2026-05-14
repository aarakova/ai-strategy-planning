import { api } from './client';

export type UserResponse = {
  id: string;
  login: string;
};

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const authApi = {
  register: async (login: string, password: string) => {
    const hashed = await hashPassword(password);
    return api.post<UserResponse>('/auth/register', { login, password: hashed });
  },

  login: async (login: string, password: string) => {
    const hashed = await hashPassword(password);
    return api.post<UserResponse>('/auth/login', { login, password: hashed });
  },

  logout: () => api.post<void>('/auth/logout'),

  me: () => api.get<UserResponse>('/auth/me'),
};
