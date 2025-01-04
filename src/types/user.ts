export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  site: string;
  settings?: {
    colleagues?: {
      [userId: string]: {
        color: string;
      };
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
}

export interface UserFilters {
  search: string;
  role?: 'admin' | 'user';
  status?: 'active' | 'inactive';
}

export interface SortConfig {
  key: keyof User;
  direction: 'asc' | 'desc';
}