import express from 'express';
import cors from 'cors';
import { PORT } from './config';
import { authRouter } from './routes/auth';
import { eventRouter } from './routes/events';
import { userRouter } from './routes/users';
import { holidaysRouter } from './routes/holidays';
import { sitesRouter } from './routes/sites';
import { reportRouter } from './routes/report';
import { availabilityRouter } from './routes/availability';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/events', eventRouter);
app.use('/api/users', userRouter);
app.use('/api/holidays', holidaysRouter);
app.use('/api/sites', sitesRouter);
app.use('/api/report', reportRouter);
app.use('/api/availability', availabilityRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});