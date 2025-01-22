import express from "express";
import { AuthRequest } from './types';
import { Response, NextFunction } from 'express';
import cors from "cors";
import { PORT } from "./config";
import { authRouter } from "./routes/auth";
import { eventRouter } from "./routes/events";
import { userRouter } from "./routes/users";
import { holidaysRouter } from "./routes/holidays";
import { sitesRouter } from "./routes/sites";
import { reportRouter } from "./routes/report";
import { availabilityRouter } from "./routes/availability";
import { agendaRouter } from "./routes/agenda";
import { exportRouter } from "./routes/export";

const app = express();

app.use(cors());
app.use(express.json());

app.use((req: AuthRequest, res: Response, next: NextFunction) => {
  next();
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/agenda", agendaRouter);
app.use("/api/availability", availabilityRouter);
app.use("/api/events", eventRouter);
app.use("/api/holidays", holidaysRouter);
app.use("/api/report", reportRouter);
app.use("/api/sites", sitesRouter);
app.use("/api/users", userRouter);
app.use("/api/export", exportRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});