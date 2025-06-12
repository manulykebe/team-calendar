import { API_URL } from "./config";
import { Period, PeriodsData } from "../../types/period";

export async function getPeriods(
  token: string,
  site: string,
  year: number
): Promise<PeriodsData> {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  const response = await fetch(`${API_URL}/sites/${site}/periods/${year}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404 || response.status === 403) {
      // Return default structure if no periods exist or admin access required
      return {
        year,
        site,
        periods: [],
        lastUpdated: new Date().toISOString(),
      };
    }
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch periods" }));
    throw new Error(error.message);
  }
  return response.json();
}

export async function savePeriods(
  token: string,
  site: string,
  year: number,
  periods: Period[]
): Promise<PeriodsData> {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  const periodsData: PeriodsData = {
    year,
    site,
    periods,
    lastUpdated: new Date().toISOString(),
  };

  const response = await fetch(`${API_URL}/sites/${site}/periods/${year}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(periodsData),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to save periods" }));
    throw new Error(error.message);
  }
  return response.json();
}

export async function resetToDefaultPeriods(
  token: string,
  site: string,
  year: number
): Promise<PeriodsData> {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  const response = await fetch(`${API_URL}/sites/${site}/periods/${year}/reset`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to reset periods" }));
    throw new Error(error.message);
  }
  return response.json();
}