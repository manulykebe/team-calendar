import { ApiError } from '../../types/api';

const API_URL = 'http://localhost:3000/api';

interface RequestConfig extends RequestInit {
  token?: string;
}

async function request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
  const { token, ...init } = config;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...init.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, { ...init, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new ApiError(error.message, response.status);
  }

  return response.json();
}