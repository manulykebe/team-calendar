import express from "express";
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

const app = express();

app.use(cors());
app.use(express.json());

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