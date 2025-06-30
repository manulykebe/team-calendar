import { Router } from "express";
import { readFile, getStorageKey } from "../services/storage.js";
import { readSiteData } from "../utils.js";
import { format, parseISO, isValid } from "date-fns";

const router = Router();

// Get the on-duty staff member for a specific site and date
router.get("/:site", async (req, res) => {
  try {
    const { site } = req.params;
    const { date } = req.query;
    var targetDate = new Date();

    // Read the site data to ensure it exists
    const siteData = await readSiteData(site);
    const dutyStartTime = siteData.duty?.startTime || "17:30";
    const dutyEndTimeNextDay = siteData.duty?.endTimeNextDay || "08:00";

    // Use current date if not provided
    // if current tim is prior to 8:00 AM, use yesterday's date
    if (!date) {
      const currentHour = new Date().getHours();
      const currentMinute = new Date().getMinutes();

      // If current time is before dutyEndTimeNextDay, use yesterday's date
      if (currentHour < parseISO(dutyEndTimeNextDay).getHours() && currentMinute < parseISO(dutyEndTimeNextDay).getMinutes()) {
        targetDate.setDate(targetDate.getDate() - 1);
      }
    } else {
      targetDate = parseISO(date as string);
    }


    if (!isValid(targetDate)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Format date to YYYY-MM-DD
    const formattedDate = format(targetDate, "yyyy-MM-dd");

    // Read on-duty schedule
    const key = getStorageKey("sites", site, "events", "on-duty.json");
    let onDutyData;

    try {
      const data = await readFile(key);
      onDutyData = JSON.parse(data);
    } catch (error) {
      return res.status(404).json({ message: "On-duty schedule not found" });
    }

    // Find the on-duty person for the target date
    const onDutyEntry = onDutyData.schedule.find((entry: any) => entry.date === formattedDate);

    if (!onDutyEntry) {
      return res.status(404).json({ message: "No on-duty staff found for the specified date: " + formattedDate });
    }

    // Get user details
    const user = siteData.users.find((u: any) => u.id === onDutyEntry.userId);

    if (!user) {
      return res.status(404).json({ message: "On-duty user not found" });
    }

    res.json({
      date: formattedDate,
      userId: onDutyEntry.userId,
      name: `dr. ${user.firstName} ${user.lastName}`,
      email: user.email,
      mobile: user.mobile,
      from: `${formattedDate} ${dutyStartTime}`,
      to: `${(() => {
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        return format(nextDay, "yyyy-MM-dd");
      })()
        } ${dutyEndTimeNextDay}`,
    });
  } catch (error) {
    console.error("Error fetching on-duty staff:", error);
    res.status(500).json({ message: "Failed to fetch on-duty staff" });
  }
});

export { router as onDutyRouter };