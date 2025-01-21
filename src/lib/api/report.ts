import { API_URL } from "./config";

export async function getAvailabilityReport(
  token: string,
  site: string,
  userId: string,
  year: string,
  startDate?: string,
  endDate?: string,
) {
  const url = new URL(`${API_URL}/report/availability/${site}/${userId}/${year}`);
  
  // Add date filters to query parameters if provided
  if (startDate) {
    url.searchParams.append("startDate", startDate);
  }
  if (endDate) {
    url.searchParams.append("endDate", endDate);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch availability report" }));
    throw new Error(error.message);
  }

  return response.json();
}