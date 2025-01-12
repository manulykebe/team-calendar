// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface AuthResponse {
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  site: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  mobile: string;
}

// API Error Types
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// API Request Types
export interface EventCreateData {
  title: string;
  description: string;
  date: string;
}

export interface EventUpdateData extends Partial<EventCreateData> {
  id: string;
}

export interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: "admin" | "user";
  status?: "active" | "inactive";
  settings?: Record<string, any>;
}
