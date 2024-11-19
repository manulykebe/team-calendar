// server/src/types/index.ts
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface UserPayload extends JwtPayload {
  id: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}