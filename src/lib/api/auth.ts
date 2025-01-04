import { API_URL } from './config';
import type { AuthResponse, RegisterData } from './types';

export async function login(email: string, password: string, site: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, site })
  });
  
  if (!response.ok) throw new Error('Invalid credentials');
  return response.json();
}

export async function register(userData: RegisterData): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) throw new Error('Registration failed');
  return response.json();
}