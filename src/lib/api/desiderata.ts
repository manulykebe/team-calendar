import { API_URL } from "./config";

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
  const response = await fetch(`${API_URL}/desiderata/quota/${periodId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch desiderata quota" }));
    throw new Error(error.message);
  }

  return response.json();
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
  const response = await fetch(`${API_URL}/desiderata/validate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      periodId,
      startDate,
      endDate,
      excludeEventId,
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to validate desiderata" }));
    throw new Error(error.message);
  }

  return response.json();
}

/**
 * Recalculate desiderata usage for a user (admin only)
 */
export async function recalculateDesiderata(
  token: string,
  userId: string,
  periodId: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/desiderata/recalculate/${userId}/${periodId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to recalculate desiderata" }));
    throw new Error(error.message);
  }
}

export interface PendingDesiderataGridItem {
  date: string;
  [userId: string]: string | number;
  total: number;
}

export interface PendingDesiderataResponse {
  site: string;
  year: string;
  periodId: string;
  count: number;
  requests: any[];
  desiderata?: any[];
  grid?: PendingDesiderataGridItem[];
}

/**
 * Get pending desiderata for a specific year and period
 */
export async function getPendingDesiderata(
  token: string,
  year: string,
  periodId: string
): Promise<PendingDesiderataResponse> {
  const response = await fetch(
    `${API_URL}/desiderata/pending/${year}/${periodId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch pending desiderata" }));
    throw new Error(error.message);
  }

  return response.json();
}
