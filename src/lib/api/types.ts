export interface EventData {
  title: string;
  description: string;
  date: string;
}

export interface AuthResponse {
  token: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
  site: string;
}