import { Request, Response, NextFunction } from 'express';
import { hashString } from '../utils/hashing.js';
import { DeviceToken } from '../models/DeviceToken.js';
import { Device } from '../models/Device.js';

export async function deviceAuthMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.header('X-Device-Token');

  if (!token) {
    res.status(401).json({
      message: 'Device Token Missing',
      error_code: 'MISSING_TOKEN',
    });
    return;
  }

  const tokenHash = hashString(token);
  const deviceToken = await DeviceToken.findOne({ tokenHash });

  if (!deviceToken) {
    res.status(401).json({
      message: 'Invalid Device Token',
      error_code: 'INVALID_TOKEN',
    });
    return;
  }

  if (deviceToken.revokedAt) {
    res.status(401).json({
      message: 'Invalid Device Token',
      error_code: 'TOKEN_REVOKED',
    });
    return;
  }

  if (deviceToken.expiresAt && deviceToken.expiresAt < new Date()) {
    res.status(401).json({
      message: 'Invalid Device Token',
      error_code: 'TOKEN_EXPIRED',
    });
    return;
  }

  // Update lastUsedAt
  deviceToken.lastUsedAt = new Date();
  await deviceToken.save();

  const device = await Device.findById(deviceToken.deviceId);
  if (!device || device.isArchived) {
    res.status(401).json({
      message: 'Device not found or archived',
      error_code: 'DEVICE_NOT_FOUND',
    });
    return;
  }

  req.device = device;
  next();
}
