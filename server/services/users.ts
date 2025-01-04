import bcrypt from 'bcryptjs';
import { User } from '../types';
import { readSiteData, writeSiteData } from '../utils';

export async function getUsers(site: string) {
  const data = await readSiteData(site);
  return data.users;
}

export async function createUser(userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  mobile: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  site: string;
}) {
  const data = await readSiteData(userData.site);
  
  if (data.users.some((u: User) => u.email === userData.email)) {
    throw new Error('Email already exists');
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const newUser: User = {
    id: crypto.randomUUID(),
    ...userData,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  data.users.push(newUser);
  await writeSiteData(userData.site, data);

  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

export async function updateUser(userId: string, userData: {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  mobile?: string;
  role?: 'admin' | 'user';
  status?: 'active' | 'inactive';
  site: string;
}) {
  const data = await readSiteData(userData.site);
  
  const userIndex = data.users.findIndex((u: User) => u.id === userId);
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  if (userData.email && userData.email !== data.users[userIndex].email) {
    const emailExists = data.users.some(
      (u: User) => u.id !== userId && u.email === userData.email
    );
    if (emailExists) {
      throw new Error('Email already exists');
    }
  }

  const updatedUser = {
    ...data.users[userIndex],
    ...userData,
    updatedAt: new Date().toISOString()
  };

  if (userData.password) {
    updatedUser.password = await bcrypt.hash(userData.password, 10);
  }

  data.users[userIndex] = updatedUser;
  await writeSiteData(userData.site, data);

  const { password, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
}

export async function deleteUser(userId: string, site: string) {
  const data = await readSiteData(site);
  
  const userIndex = data.users.findIndex((u: User) => u.id === userId);
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  // Prevent deleting the last admin user
  const isAdmin = data.users[userIndex].role === 'admin';
  if (isAdmin) {
    const adminCount = data.users.filter((u: User) => u.role === 'admin').length;
    if (adminCount === 1) {
      throw new Error('Cannot delete the last admin user');
    }
  }

  data.users.splice(userIndex, 1);
  await writeSiteData(site, data);
}