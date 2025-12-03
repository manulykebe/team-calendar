import { Response, NextFunction } from "express";
import { AuthRequest } from "../types.js";

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      message: req.i18n.t('auth.notAuthenticated')
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: req.i18n.t('auth.adminOnly') || 'Admin access required'
    });
  }

  next();
};
