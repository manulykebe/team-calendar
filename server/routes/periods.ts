import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { AuthRequest } from "../types.js";
import { readFile, writeFile, getStorageKey } from "../services/storage.js";
import { format, addDays, subDays, parseISO } from "date-fns";

const router = Router();

router.use(authenticateToken);

interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  editingStatus: 'closed' | 'open-holiday' | 'open-desiderata';
  createdAt: string;
  updatedAt: string;
}

interface PeriodsData {
  year: number;
  site: string;
  periods: Period[];
  lastUpdated: string;
}

// Generate default periods for a given year
function generateDefaultPeriods(year: number): Period[] {
  const periods: Period[] = [];
  
  // Christmas (Previous Year) to Easter
  periods.push({
    id: crypto.randomUUID(),
    name: "Christmas to Easter",
    startDate: `${year - 1}-12-23`,
    endDate: `${year}-04-15`,
    editingStatus: 'closed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Easter to June
  periods.push({
    id: crypto.randomUUID(),
    name: "Easter to June",
    startDate: `${year}-04-16`,
    endDate: `${year}-06-30`,
    editingStatus: 'open-holiday',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // July to August
  periods.push({
    id: crypto.randomUUID(),
    name: "July to August",
    startDate: `${year}-07-01`,
    endDate: `${year}-08-31`,
    editingStatus: 'open-desiderata',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // September to Christmas (Including Next Year's Holiday)
  periods.push({
    id: crypto.randomUUID(),
    name: "September to Christmas",
    startDate: `${year}-09-01`,
    endDate: `${year + 1}-01-07`,
    editingStatus: 'closed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return periods;
}

// Get periods for a specific site and year - READABLE BY ALL AUTHENTICATED USERS
router.get("/:site/periods/:year", async (req: AuthRequest, res) => {
  try {
    const { site, year } = req.params;
    const yearNum = parseInt(year);

    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
      return res.status(400).json({ message: req.i18n.t('periods.invalidYear') });
    }

    // All authenticated users can read periods (no admin check here)
    const key = getStorageKey("sites", site, "periods", `${year}.json`);
    
    try {
      const data = await readFile(key);
      const periodsData: PeriodsData = JSON.parse(data);
      res.json(periodsData);
    } catch (error) {
      // If file doesn't exist, return empty periods structure
      const emptyPeriodsData: PeriodsData = {
        year: yearNum,
        site,
        periods: [],
        lastUpdated: new Date().toISOString(),
      };
      res.json(emptyPeriodsData);
    }
  } catch (error) {
    console.error("Error fetching periods:", error);
    res.status(500).json({ message: req.i18n.t('periods.failedToFetchPeriods') });
  }
});

// Save periods for a specific site and year - ADMIN ONLY
router.put("/:site/periods/:year", async (req: AuthRequest, res) => {
  try {
    const { site, year } = req.params;
    const yearNum = parseInt(year);
    const periodsData: PeriodsData = req.body;

    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
      return res.status(400).json({ message: req.i18n.t('periods.invalidYear') });
    }

    // Check if user has admin access for write operations
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: req.i18n.t('periods.adminAccessRequired') });
    }

    // Validate periods data
    if (!Array.isArray(periodsData.periods)) {
      return res.status(400).json({ message: req.i18n.t('periods.invalidPeriodData') });
    }

    // Validate each period
    for (const period of periodsData.periods) {
      if (!period.name || !period.startDate || !period.endDate || !period.editingStatus) {
        return res.status(400).json({ message: req.i18n.t('periods.allPeriodFieldsRequired') });
      }

      // Validate dates
      try {
        const startDate = parseISO(period.startDate);
        const endDate = parseISO(period.endDate);
        if (endDate <= startDate) {
          return res.status(400).json({ 
            message: req.i18n.t('periods.endDateMustBeAfterStart', { name: period.name }) 
          });
        }
      } catch (error) {
        return res.status(400).json({ 
          message: req.i18n.t('periods.invalidDateFormat') 
        });
      }
    }

    // Check for overlapping periods
    const sortedPeriods = [...periodsData.periods].sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    for (let i = 0; i < sortedPeriods.length - 1; i++) {
      const current = sortedPeriods[i];
      const next = sortedPeriods[i + 1];
      
      if (new Date(current.endDate) >= new Date(next.startDate)) {
        return res.status(400).json({ 
          message: req.i18n.t('periods.periodsOverlap', { 
            period1: current.name, 
            period2: next.name 
          }) 
        });
      }
    }

    const updatedPeriodsData: PeriodsData = {
      ...periodsData,
      year: yearNum,
      site,
      lastUpdated: new Date().toISOString(),
    };

    const key = getStorageKey("sites", site, "periods", `${year}.json`);
    await writeFile(key, JSON.stringify(updatedPeriodsData, null, 2));

    res.json(updatedPeriodsData);
  } catch (error) {
    console.error("Error saving periods:", error);
    res.status(500).json({ message: req.i18n.t('periods.failedToSavePeriods') });
  }
});

// Reset periods to defaults for a specific site and year - ADMIN ONLY
router.post("/:site/periods/:year/reset", async (req: AuthRequest, res) => {
  try {
    const { site, year } = req.params;
    const yearNum = parseInt(year);

    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
      return res.status(400).json({ message: req.i18n.t('periods.invalidYear') });
    }

    // Check if user has admin access for write operations
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: req.i18n.t('periods.adminAccessRequired') });
    }

    const defaultPeriods = generateDefaultPeriods(yearNum);
    const periodsData: PeriodsData = {
      year: yearNum,
      site,
      periods: defaultPeriods,
      lastUpdated: new Date().toISOString(),
    };

    const key = getStorageKey("sites", site, "periods", `${year}.json`);
    await writeFile(key, JSON.stringify(periodsData, null, 2));

    res.json(periodsData);
  } catch (error) {
    console.error("Error resetting periods:", error);
    res.status(500).json({ message: req.i18n.t('periods.failedToResetPeriods') });
  }
});

export { router as periodsRouter };