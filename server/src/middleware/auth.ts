import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User, IUser } from '../models/User.js';
import { errorResponse } from '../utils/response.js';

interface JwtPayload {
  userId: string;
  email: string;
  roles: string[];
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    // Check Authorization header: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && (req.cookies.token || req.cookies.calltrack_session)) {
      token = req.cookies.token || req.cookies.calltrack_session;
    }

    if (!token) {
      errorResponse(res, 'Unauthenticated.', 401);
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    const user = await User.findById(decoded.userId).populate('agentId');

    if (!user) {
      errorResponse(res, 'Unauthenticated.', 401);
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    errorResponse(res, 'Unauthenticated.', 401);
  }
}
