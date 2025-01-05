import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import { readSiteData } from '../utils';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    site: string;
    role?: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: () => void) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    // Get user role from site data
    const siteData = await readSiteData(decoded.site);
    const user = siteData.users.find((u: any) => u.id === decoded.id);
    
    if (!user) {
      return res.sendStatus(403);
    }

    req.user = {
      ...decoded,
      role: user.role
    };
    
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
};