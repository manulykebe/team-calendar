import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface UserPayload extends JwtPayload {
  id: string;
  login: string;
  email: string;
  sites: string[];
  roles: UserRole[];
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export type UserRole = 'admin' | 'team-admin' | 'team-super-user' | 'team-member';

export interface User {
  id: string;
  login: string;
  password: string;
  email: string;
  sites: string[];
  roles: UserRole[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  status: 'unavailable' | 'desired' | 'available';
  private: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankHoliday {
  id: string;
  title: string;
  date: string;
  type: 'bank-holiday' | 'regional-holiday';
  region?: string;
}