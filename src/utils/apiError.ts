import axios from 'axios';

interface ApiErrorResponse {
  message?: string;
  detail?: string;
  title?: string;
  errors?: Record<string, string[]>;
}

export function getApiError(
  error: unknown,
  fallback = 'Ocurrió un error inesperado.'
): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data;

    if (data?.errors) {
      const messages = Object.values(data.errors)
        .flat();

      if (messages.length > 0) {
        return messages.join(' ');
      }
    }

    return (
      data?.message ||
      data?.detail ||
      data?.title ||
      fallback
    );
  }

  return fallback;
}