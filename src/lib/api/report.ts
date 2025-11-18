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

export async function getAllAvailabilityReport(
  token: string,
  site: string,
  year: string,
) {
  const url = new URL(`${API_URL}/users/`);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch all users availability" }));
    throw new Error(error.message);
  }

  const allSiteUsers = await response.json();
  debugger
  // Fetch availability report for each user
  const reports = await Promise.all(
    // filter allSiteUsers to only role <> 'admin'
    allSiteUsers.filter((user: any) => user.role !== 'admin').filter((user: any) => user.initials !== 'ALV' && year == '2025').map(async (user: any) => {
      try {
        const userReport = await getAvailabilityReport(
          token,
          site,
          user.id,
          year
        );
        return {
          userId: user.id,
          initials: user.initials,
          availability: userReport.availability,
        };
      } catch (error) {
        console.error(`Failed to fetch report for user ${user.id}:`, error);
        return {
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          report: null,
          error: error instanceof Error ? error.message : "Failed to fetch report",
        };
      }
    })
  );
  
  return reports;
}

export async function getAllAvailabilityReportAggregated(
  token: string,
  site: string,
  year: string,
) {
  const reports = await getAllAvailabilityReport(token, site, year);

  // loop over all dates in reports, and aggregate users (joined by "/") if not availabe per am/pm
  // result should be of the form:
  // {
  //   ...
  //   date: "2023-01-02", datepart: "am", users: "JD/AS",  // users unavailable
  //   date: "2023-01-02", datepart: "pm", users: "MW",      // users unavailable
  //   ...
  // }
  const aggregated: { date: string; datepart: string; users: string }[] = [];

  const dateMap: { [key: string]: { am: string[]; pm: string[] } } = {};

  reports.forEach((report: any) => {
    if (report.error || !report.availability) {
      return;
    }

    Object.entries(report.availability).forEach(([date, availability]: [string, any]) => {
      if (!dateMap[date]) {
        dateMap[date] = { am: [], pm: [] };
      }
      if (!availability.am) {
        dateMap[date].am.push(report.initials);
      }
      if (!availability.pm) {
        dateMap[date].pm.push(report.initials);
      }
    });
  });

  Object.entries(dateMap).forEach(([date, availability]) => {
    if (availability.am.length > 0) {
      aggregated.push({ date, datepart: "am", users: availability.am.sort().join("/") });
    }
    if (availability.pm.length > 0) {
      aggregated.push({ date, datepart: "pm", users: availability.pm.sort().join("/") });
    }
  });

  return aggregated;

}