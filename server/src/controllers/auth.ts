import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const usersPath = path.join(__dirname, '../data/users.json');

async function getUsers(): Promise<User[]> {
  const data = await fs.readFile(usersPath, 'utf8');
  return JSON.parse(data).users;
}

export const login = async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body;
    const users = await getUsers();
    const user = users.find(u => u.login === login);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        login: user.login, 
        email: user.email,
        sites: user.sites,
        roles: user.roles 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    );

    res.json({ 
      token,
      user: {
        id: user.id,
        login: user.login,
        email: user.email,
        sites: user.sites,
        roles: user.roles
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};