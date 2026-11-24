import axios from 'axios';

import { env } from '@/config/env';
import { clearSession, getToken } from './session';

export const httpClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de solicitudes
httpClient.interceptors.request.use((config) => {
  const token = getToken();

  const isLogin = config.url === '/auth/login';

  if (
    token &&
    !isLogin &&
    !config.headers.has('Authorization')
  ) {
    config.headers.set(
      'Authorization',
      `Bearer ${token}`
    );
  }

  return config;
});

// Interceptor de respuestas
httpClient.interceptors.response.use(
  (response) => response,

  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      const isLogin =
        error.config?.url === '/auth/login';

      const currentToken = getToken();

      const requestToken =
        error.config?.headers.get('Authorization');

      if (
        status === 401 &&
        !isLogin &&
        currentToken &&
        requestToken === `Bearer ${currentToken}`
      ) {
        clearSession();
      }
    }

    return Promise.reject(error);
  }
);