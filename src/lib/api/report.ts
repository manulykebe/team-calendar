import { API_URL } from "./config";

export async function getAvailabilityReport(
  token: string,
  site: string,
  userId: string,
  year: string,
) {
  const response = await fetch(
    `${API_URL}/report/availability/${site}/${userId}/${year}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch availability report" }));
    throw new Error(error.message);
  }

  return response.json();
}
