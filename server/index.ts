import express from 'express';
import cors from 'cors';
import { PORT } from './config';
import { authRouter } from './routes/auth';
import { eventRouter } from './routes/events';
import { userRouter } from './routes/users';
import healthRouter from './routes/health';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/events', eventRouter);
app.use('/api/users', userRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});