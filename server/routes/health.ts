import { Router } from "express";

const router = Router();

router.get("/", (_, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "1.2.14"
  });
});

export { router as healthRouter };