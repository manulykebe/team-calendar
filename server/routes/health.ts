import { Router } from "express";
import { AuthRequest } from "../types.js";

const router = Router();

router.get("/", (req: AuthRequest, res) => {
  res.json({
    status: req.i18n.t('health.status'),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "1.2.14",
    language: req.i18n.getLanguage()
  });
});

export { router as healthRouter };