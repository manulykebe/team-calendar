import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import auth from './middleware/auth.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Public routes
app.post('/api/login', (req, res) => {
  // Demo login - in production, verify credentials against database
  const token = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
  res.json({ token });
});

// Protected routes
app.get('/api/health', auth, (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/api/greeting', auth, (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});