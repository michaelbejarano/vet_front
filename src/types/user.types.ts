export interface User {
  id: number;
  email: string;
  roleId: number;
  isActive: boolean;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  roleId: number;
}

export interface UpdateUserRequest {
  id: number;
  email: string;
  roleId: number;
  isActive: boolean;
}

export interface CreateUserResponse {
  id: number;
  message: string;
}