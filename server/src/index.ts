import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import auth from './middleware/auth.js';
import { login } from './controllers/auth.js';
import { getEvents, createEvent, updateEvent, deleteEvent } from './controllers/events.js';
import { getBankHolidays } from './controllers/bankHolidays.js';
import { AuthRequest } from './types/index.js';
import { getAllUsers, createUser, updateUser, deleteUser, getColleagues } from './controllers/users.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Auth routes
app.post('/api/login', login);

// Protected routes
app.get('/api/health', auth, (req: AuthRequest, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/api/greeting', auth, (req: AuthRequest, res: Response) => {
  res.json({ message: 'Hello from the server!' });
});

app.get('/api/user', auth, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// Calendar events routes
app.get('/api/sites/:site/events/:year', auth, getEvents);
app.post('/api/sites/:site/events/:year', auth, createEvent);
app.put('/api/sites/:site/events/:year/:eventId', auth, updateEvent);
app.delete('/api/sites/:site/events/:year/:eventId', auth, deleteEvent);

// Bank holidays routes
app.get('/api/bank-holidays/:country/:year', auth, getBankHolidays);

// User management routes
app.get('/api/users', auth, getAllUsers);
app.post('/api/users', auth, createUser);
app.put('/api/users/:id', auth, updateUser);
app.delete('/api/users/:id', auth, deleteUser);
app.get('/api/colleagues', auth, getColleagues);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// catchall route
app.all('*', (req: Request, res: Response) => {
  res.status(400).json({ 'team-calendar': 'v1.0.0.' });
});