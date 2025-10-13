import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import { readSiteData } from "../utils.js";
import { AuthRequest } from "../types.js";

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: () => void,
) => {
  // Development mode: Allow bypassing auth with query param
  if (process.env.NODE_ENV !== 'production' && req.query.devBypass === 'true') {
    const testSite = (req.query.site as string) || 'azjp';
    const testUserId = (req.query.userId as string) || 'test-user';

    try {
      const siteData = await readSiteData(testSite);
      const user = siteData.users[0]; // Use first user for testing

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          site: testSite,
          role: user.role,
        };
        console.log(`[DEV] Bypassing auth for site: ${testSite}, user: ${user.email}`);
        return next();
      }
    } catch (error) {
      console.error('[DEV] Failed to bypass auth:', error);
    }
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: req.i18n.t('auth.accessTokenRequired') });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);

    // Get user role from site data
    const siteData = await readSiteData(decoded.site);
    const user = siteData.users.find((u: any) => u.id === decoded.id);

    if (!user) {
      return res.status(403).json({ message: req.i18n.t('auth.userNotFound') });
    }

    req.user = {
      ...decoded,
      role: user.role,
    };

    next();
  } catch (err) {
    return res.status(403).json({ message: req.i18n.t('auth.invalidToken') });
  }
};