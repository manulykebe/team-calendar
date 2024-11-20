// In server/src/controllers/users.ts
import { Response } from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { AuthRequest, User } from '../types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const usersPath = path.join(__dirname, '../data/users.json');

async function getUsers(): Promise<{ users: User[] }> {
  const data = await fs.readFile(usersPath, 'utf8');
  return JSON.parse(data);
}

async function saveUsers(users: User[]): Promise<void> {
  await fs.writeFile(usersPath, JSON.stringify({ users }, null, 2));
}

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.roles.includes('admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { users } = await getUsers();
    // Filter out sensitive data
    const sanitizedUsers = users.map(({ password, ...user }) => user);
    res.json({ users: sanitizedUsers });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.roles.includes('admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const userData = req.body;
    const { users } = await getUsers();

    if (users.some(u => u.login === userData.login)) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const newUser: User = {
      id: Date.now().toString(),
      ...userData,
      password: hashedPassword,
      isDeleted: false
    };

    users.push(newUser);
    await saveUsers(users);

    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.roles.includes('admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { id } = req.params;
    const updates = req.body;
    const { users } = await getUsers();
    
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If password is provided, hash it
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    } else {
      // Keep existing password if not provided
      delete updates.password;
    }

    users[userIndex] = {
      ...users[userIndex],
      ...updates
    };

    await saveUsers(users);

    // Return updated user without password
    const { password, ...userWithoutPassword } = users[userIndex];
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.roles.includes('admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { id } = req.params;
    const { users } = await getUsers();
    
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    users[userIndex].isDeleted = true;
    await saveUsers(users);
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getColleagues = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const currentUserSites = req.user?.sites || [];

    const { users } = await getUsers();

    const colleagues = users
      .filter(user => 
        user.id !== currentUserId &&
        user.isDeleted !== true &&
        user.sites.some(site => currentUserSites.includes(site))
      )
      .map(user => ({
        id: user.id,
        login: user.login
      }));

    res.json({ colleagues });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};