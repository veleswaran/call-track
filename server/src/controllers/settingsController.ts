import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SystemSetting } from '../models/SystemSetting.js';

export async function getBranding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const setting = await SystemSetting.findOne({ key: 'app_sitename' });
    res.status(200).json({
      app_sitename: setting ? setting.value : 'CallTrack AI Admin',
    });
  } catch (error) {
    next(error);
  }
}

export async function listSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await SystemSetting.find();
    const settingsMap: Record<string, any> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    res.status(200).json({ data: settingsMap });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { settings } = z.object({
      settings: z.record(z.any()),
    }).parse(req.body);

    for (const [key, value] of Object.entries(settings)) {
      await SystemSetting.findOneAndUpdate(
        { key },
        { key, value },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({ message: 'Settings updated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function uploadLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // In Express with multer memoryStorage, req.file.buffer contains the file bytes
    let logoUrl = '/logo.png';
    if (req.file) {
      if (req.file.buffer) {
        logoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      } else if (req.file.filename) {
        logoUrl = `/uploads/${req.file.filename}`;
      }
    }

    await SystemSetting.findOneAndUpdate(
      { key: 'app_logo' },
      { key: 'app_logo', value: logoUrl },
      { upsert: true }
    );

    res.status(200).json({
      message: 'Logo updated successfully',
      logo_url: logoUrl,
    });
  } catch (error) {
    next(error);
  }
}
