export interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  editingStatus: 'closed' | 'open-holiday' | 'open-desiderata';
  createdAt: string;
  updatedAt: string;
  quotas?: {
    totalWeekends: number;
    weekendsWithPublicHolidays: number;
    netWeekends: number;
    allowedWeekendDesiderata: number;
    totalWorkingDays: number;
    workingDaysWithPublicHolidays: number;
    netWorkingDays: number;
    allowedWorkingDayDesiderata: number;
  };
}

export interface PeriodFormData {
  name: string;
  startDate: string;
  endDate: string;
  editingStatus: 'closed' | 'open-holiday' | 'open-desiderata';
}

export interface PeriodsData {
  year: number;
  site: string;
  periods: Period[];
  lastUpdated: string;
}