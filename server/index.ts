import express from "express";
import { createServer } from "http";
import cors from "cors";
import { PORT } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { eventRouter } from "./routes/events.js";
import { userRouter } from "./routes/users.js";
import { holidaysRouter } from "./routes/holidays.js";
import { sitesRouter } from "./routes/sites.js";
import { reportRouter } from "./routes/report.js";
import { availabilityRouter } from "./routes/availability.js";
import { agendaRouter } from "./routes/agenda.js";
import { exportRouter } from "./routes/export.js";
import { healthRouter } from "./routes/health.js";
import { periodsRouter } from "./routes/periods.js";
import { initializeSocketManager } from "./websocket/socketManager.js";

const app = express();
const server = createServer(app);

// Initialize WebSocket manager
const socketManager = initializeSocketManager(server);

// Configure CORS for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://superlative-longma-9e9cf8.netlify.app', 'https://jade-croissant-f8c630.netlify.app']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Make socket manager available to routes
app.use((req, res, next) => {
  (req as any).socketManager = socketManager;
  next();
});

// Health check endpoint (must be before other routes)
app.use("/api/health", healthRouter);

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/agenda", agendaRouter);
app.use("/api/availability", availabilityRouter);
app.use("/api/events", eventRouter);
app.use("/api/holidays", holidaysRouter);
app.use("/api/report", reportRouter);
app.use("/api/sites", sitesRouter);
app.use("/api/users", userRouter);
app.use("/api/export", exportRouter);
app.use("/api/sites", periodsRouter);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Team Calendar API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    websocket: "enabled"
  });
});

// WebSocket status endpoint
app.get("/api/websocket/status", (req, res) => {
  const connectedUsers = socketManager.getConnectedUsersForSite("azjp"); // Example site
  res.json({
    status: "active",
    connectedUsers: connectedUsers.length,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`⚡ WebSocket server initialized`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});