import { apiClient } from "./client";

export interface DesiderataQuotas {
  totalWeekends: number;
  weekendsWithPublicHolidays: number;
  netWeekends: number;
  allowedWeekendDesiderata: number;
  totalWorkingDays: number;
  workingDaysWithPublicHolidays: number;
  netWorkingDays: number;
  allowedWorkingDayDesiderata: number;
}

export interface DesiderataUsage {
  weekendsUsed: number;
  workingDaysUsed: number;
  weekendsRemaining: number;
  workingDaysRemaining: number;
}

export interface DesiderataQuotaInfo {
  periodId: string;
  periodName: string;
  quotas: DesiderataQuotas;
  usage: DesiderataUsage;
  lastUpdated: string;
}

export interface DesiderataValidation {
  valid: boolean;
  weekendsUsed: number;
  workingDaysUsed: number;
  weekendsAllowed: number;
  workingDaysAllowed: number;
  weekendsRemaining: number;
  workingDaysRemaining: number;
  error?: string;
}

/**
 * Get desiderata quota information for a period
 */
export async function getDesiderataQuota(
  token: string,
  periodId: string
): Promise<DesiderataQuotaInfo> {
  const response = await apiClient.get(`/desiderata/quota/${periodId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

/**
 * Validate a desiderata request
 */
export async function validateDesiderata(
  token: string,
  periodId: string,
  startDate: string,
  endDate: string,
  excludeEventId?: string
): Promise<DesiderataValidation> {
  const response = await apiClient.post(
    "/desiderata/validate",
    {
      periodId,
      startDate,
      endDate,
      excludeEventId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}

/**
 * Recalculate desiderata usage for a user (admin only)
 */
export async function recalculateDesiderata(
  token: string,
  userId: string,
  periodId: string
): Promise<void> {
  await apiClient.post(
    `/desiderata/recalculate/${userId}/${periodId}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}
