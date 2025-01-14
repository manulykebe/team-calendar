export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  role: "admin" | "user";
  status: "active" | "inactive";
  site: string;
  settings?: {
    colleagues?: {
      [userId: string]: {
        color: string;
        initials: string;
        visible?: boolean;
      };
    };
    availability?: {
    };
    colleagueOrder?: string[];
    showWeekNumber: "none" | "left" | "right";
  };
  app?: {
    weekStartsOn: string;
    color: {
      Sunday: string;
      Monday: string;
      Tuesday: string;
      Wednesday: string;
      Thursday: string;
      Friday: string;
      Saturday: string;
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
  role: "admin" | "user";
  status: "active" | "inactive";
}

export interface UserFilters {
  search: string;
  role?: "admin" | "user";
  status?: "active" | "inactive";
}

export interface SortConfig {
  key: keyof User;
  direction: "asc" | "desc";
}
