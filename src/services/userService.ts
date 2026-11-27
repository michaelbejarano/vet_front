import { httpClient } from './httpClient';

import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  CreateUserResponse,
} from '@/types/user.types';

export const userService = {
  async getAll(): Promise<User[]> {
    const { data } =
      await httpClient.get<User[]>('/users');

    return data;
  },

  async getById(id: number): Promise<User> {
    const { data } =
      await httpClient.get<User>(`/users/${id}`);

    return data;
  },

  async create(
    request: CreateUserRequest
  ): Promise<CreateUserResponse> {
    const { data } =
      await httpClient.post<CreateUserResponse>(
        '/users',
        request
      );

    return data;
  },

  async update(
    request: UpdateUserRequest
  ): Promise<void> {
    await httpClient.put(
      `/users/${request.id}`,
      request
    );
  },

  async remove(id: number): Promise<void> {
    await httpClient.delete(`/users/${id}`);
  },
};