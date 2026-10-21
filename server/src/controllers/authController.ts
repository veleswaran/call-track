import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Agent } from '../models/Agent.js';
import { config } from '../config/env.js';
import {
  generateTwoFactorSecret,
  generateQrCodeUrl,
  verifyTwoFactorToken,
  generateRecoveryCodes,
} from '../utils/totp.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function csrfCookie(req: Request, res: Response): Promise<void> {
  const token = 'csrf-' + Math.random().toString(36).substring(2);
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
  });
  res.status(204).end();
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      errorResponse(res, 'These credentials do not match our records.', 422, {
        email: ['These credentials do not match our records.'],
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      errorResponse(res, 'These credentials do not match our records.', 422, {
        email: ['These credentials do not match our records.'],
      });
      return;
    }

    // Check if 2FA is enabled and confirmed
    if (user.twoFactorConfirmedAt && user.twoFactorSecret) {
      // Store pending 2FA token
      const tempToken = jwt.sign(
        { userId: user.id, is2faPending: true },
        config.jwtSecret,
        { expiresIn: '15m' }
      );
      res.cookie('calltrack_2fa_pending', tempToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.status(200).json({ requires_two_factor: true });
      return;
    }

    // Normal successful login
    const token = jwt.sign(
      { userId: user.id, email: user.email, roles: user.roles },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie('calltrack_session', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userJson = user.toJSON();
    const agent = user.agentId ? await Agent.findById(user.agentId) : null;

    res.status(200).json({
      token,
      user: {
        ...userJson,
        is_agent: !!agent,
        agent: agent ? agent.toJSON() : null,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function twoFactorChallenge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code } = z.object({ code: z.string().min(1) }).parse(req.body);

    const pendingToken = req.cookies.calltrack_2fa_pending;
    if (!pendingToken) {
      errorResponse(res, 'Two factor challenge session expired. Please log in again.', 401);
      return;
    }

    const decoded = jwt.verify(pendingToken, config.jwtSecret) as { userId: string };
    const user = await User.findById(decoded.userId);
    if (!user || !user.twoFactorSecret) {
      errorResponse(res, 'Invalid user or two factor not enabled.', 401);
      return;
    }

    let isValid = verifyTwoFactorToken(user.twoFactorSecret, code);

    // Also check recovery codes
    if (!isValid && user.twoFactorRecoveryCodes && user.twoFactorRecoveryCodes.length > 0) {
      const formattedCode = code.toUpperCase().trim();
      const codeIndex = user.twoFactorRecoveryCodes.indexOf(formattedCode);
      if (codeIndex !== -1) {
        isValid = true;
        user.twoFactorRecoveryCodes.splice(codeIndex, 1);
        await user.save();
      }
    }

    if (!isValid) {
      errorResponse(res, 'The provided two factor authentication code was invalid.', 422, {
        code: ['The provided two factor authentication code was invalid.'],
      });
      return;
    }

    // Success! Clear pending 2FA cookie, issue full session token
    res.clearCookie('calltrack_2fa_pending');

    const token = jwt.sign(
      { userId: user.id, email: user.email, roles: user.roles },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie('calltrack_session', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userJson = user.toJSON();
    const agent = user.agentId ? await Agent.findById(user.agentId) : null;

    res.status(200).json({
      token,
      user: {
        ...userJson,
        is_agent: !!agent,
        agent: agent ? agent.toJSON() : null,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const userJson = user.toJSON();
    const agent = user.agentId ? await Agent.findById(user.agentId) : null;

    res.status(200).json({
      data: {
        ...userJson,
        two_factor_enabled: !!user.twoFactorConfirmedAt,
        two_factor_confirmed_at: user.twoFactorConfirmedAt ? user.twoFactorConfirmedAt.toISOString() : null,
        is_agent: !!agent,
        agent: agent ? agent.toJSON() : null,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.clearCookie('token');
  res.clearCookie('calltrack_session');
  res.clearCookie('calltrack_2fa_pending');
  res.status(200).json({ message: 'Successfully logged out.' });
}

export async function enableTwoFactor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { secret, otpauthUrl } = generateTwoFactorSecret('CallTrack AI', user.email);
    user.twoFactorSecret = secret;
    await user.save();

    const qrCodeUrl = await generateQrCodeUrl(otpauthUrl);
    res.status(200).json({
      secret,
      qr_code_url: qrCodeUrl,
    });
  } catch (error) {
    next(error);
  }
}

export async function confirmTwoFactor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { secret, code } = z.object({
      secret: z.string(),
      code: z.string(),
    }).parse(req.body);

    const user = req.user!;
    const isValid = verifyTwoFactorToken(secret, code);
    if (!isValid) {
      errorResponse(res, 'The provided code is invalid.', 422, {
        code: ['The provided code is invalid.'],
      });
      return;
    }

    const recoveryCodes = generateRecoveryCodes();
    user.twoFactorSecret = secret;
    user.twoFactorConfirmedAt = new Date();
    user.twoFactorRecoveryCodes = recoveryCodes;
    await user.save();

    res.status(200).json({ recovery_codes: recoveryCodes });
  } catch (error) {
    next(error);
  }
}

export async function disableTwoFactor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { password } = z.object({ password: z.string() }).parse(req.body);
    const user = req.user!;

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      errorResponse(res, 'The password you entered is incorrect.', 422, {
        password: ['The password you entered is incorrect.'],
      });
      return;
    }

    user.twoFactorSecret = null;
    user.twoFactorConfirmedAt = null;
    user.twoFactorRecoveryCodes = [];
    await user.save();

    res.status(200).json({ message: 'Two-factor authentication disabled.' });
  } catch (error) {
    next(error);
  }
}

export async function getRecoveryCodes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { password } = z.object({ password: z.string() }).parse(req.body);
    const user = req.user!;

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      errorResponse(res, 'The password you entered is incorrect.', 422, {
        password: ['The password you entered is incorrect.'],
      });
      return;
    }

    res.status(200).json({ recovery_codes: user.twoFactorRecoveryCodes || [] });
  } catch (error) {
    next(error);
  }
}

export async function updatePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { current_password, password } = z.object({
      current_password: z.string(),
      password: z.string().min(8),
    }).parse(req.body);

    const user = req.user!;
    const isMatch = await user.comparePassword(current_password);
    if (!isMatch) {
      errorResponse(res, 'The provided password does not match your current password.', 422, {
        current_password: ['The provided password does not match your current password.'],
      });
      return;
    }

    user.password = password;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
}
