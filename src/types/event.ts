export interface Event {
  type: string;
  id: string;
  userId: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  status?: 'pending' | 'approved' | 'denied';
  createdAt: string;
  updatedAt: string;
}