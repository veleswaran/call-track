import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.js';

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'Unauthenticated.', 401);
      return;
    }

    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r.toLowerCase()));
    if (!hasRole) {
      errorResponse(res, 'This action is unauthorized.', 403);
      return;
    }

    next();
  };
}
