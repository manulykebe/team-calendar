import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { AuthRequest } from "../types.js";
import {
  validateDesiderataQuota,
  recalculateUserDesiderata,
  getUserDesiderataUsage,
  getPendingDesiderataByPeriod,
} from "../services/desiderata.js";
import { readFile, getStorageKey } from "../services/storage.js";

const router = Router();

router.use(authenticateToken);

// Get desiderata quota info for a user and period
router.get("/quota/:periodId", async (req: AuthRequest, res) => {
  try {
    const { periodId } = req.params;
    const userId = req.user!.id;
    const site = req.user!.site;

    // Get period quotas
    const periodsKey = getStorageKey(site, "periods", "2026"); // TODO: Make year dynamic
    const periodsDataStr = await readFile(periodsKey);
    const periodsData = JSON.parse(periodsDataStr);
    const period = periodsData.periods.find((p: any) => p.id === periodId);

    if (!period) {
      return res.status(404).json({
        message: req.i18n.t('periods.periodNotFound') || "Period not found"
      });
    }

    if (!period.quotas) {
      return res.status(400).json({
        message: "Period quotas not configured"
      });
    }

    // Get user's current usage
    const usage = await getUserDesiderataUsage(site, userId, periodId);

    res.json({
      periodId,
      periodName: period.name,
      quotas: period.quotas,
      usage: {
        weekendsUsed: usage.weekendsUsed,
        workingDaysUsed: usage.workingDaysUsed,
        weekendsRemaining: Math.max(0, period.quotas.allowedWeekendDesiderata - usage.weekendsUsed),
        workingDaysRemaining: Math.max(0, period.quotas.allowedWorkingDayDesiderata - usage.workingDaysUsed)
      },
      lastUpdated: usage.lastUpdated
    });
  } catch (error) {
    console.error("Failed to get desiderata quota:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to get desiderata quota"
    });
  }
});

// Validate a desiderata request
router.post("/validate", async (req: AuthRequest, res) => {
  try {
    const { periodId, startDate, endDate, excludeEventId } = req.body;
    const userId = req.user!.id;
    const site = req.user!.site;

    if (!periodId || !startDate || !endDate) {
      return res.status(400).json({
        message: "Missing required fields: periodId, startDate, endDate"
      });
    }

    const validation = await validateDesiderataQuota(
      site,
      userId,
      periodId,
      startDate,
      endDate,
      excludeEventId
    );

    res.json(validation);
  } catch (error) {
    console.error("Failed to validate desiderata:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to validate desiderata"
    });
  }
});

// Recalculate desiderata usage for a user (admin only)
router.post("/recalculate/:userId/:periodId", async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        message: req.i18n.t('common.unauthorized') || "Unauthorized"
      });
    }

    const { userId, periodId } = req.params;
    const site = req.user!.site;

    await recalculateUserDesiderata(site, userId, periodId);

    res.json({
      message: "Desiderata usage recalculated successfully"
    });
  } catch (error) {
    console.error("Failed to recalculate desiderata:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to recalculate desiderata"
    });
  }
});

// Get pending desiderata requests filtered by year and period
router.get("/pending/:year/:periodId", async (req: AuthRequest, res) => {
  try {
    const { year, periodId } = req.params;
    const site = req.user!.site;

    const pendingRequests = await getPendingDesiderataByPeriod(site, year, periodId);

    res.json({
      site,
      year,
      periodId,
      count: pendingRequests.length,
      requests: pendingRequests
    });
  } catch (error) {
    console.error("Failed to get pending desiderata:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to get pending desiderata"
    });
  }
});

export { router as desiderataRouter };
