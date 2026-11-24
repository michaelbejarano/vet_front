import { httpClient } from './httpClient';

import type {
  LoginRequest,
  LoginResponse,
  CurrentUser,
  Session,
} from '@/types/auth.types';

export const authService = {
  async login(
    email: string,
    password: string
  ): Promise<Session> {
    const credentials: LoginRequest = {
      email,
      password,
    };

    // 1. Obtener JWT
    const { data } =
      await httpClient.post<LoginResponse>(
        '/auth/login',
        credentials
      );

    // 2. Obtener perfil autenticado
    const user = await authService.getMe(
      data.accessToken
    );

    // 3. Devolver sesión completa
    return {
      token: data.accessToken,
      user,
    };
  },

  async getMe(token?: string): Promise<CurrentUser> {
    const { data } =
      await httpClient.get<CurrentUser>(
        '/auth/me',
        token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          : undefined
      );

    return data;
  },
};