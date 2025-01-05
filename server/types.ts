export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
  site: string;
  role: 'admin' | 'user';
}

export interface Event {
  id: string;
  userId: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}