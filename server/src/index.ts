import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import auth from './middleware/auth.js';
import { login } from './controllers/auth.js';
import { AuthRequest } from './types/index.js';

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
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
