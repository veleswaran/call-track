import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Agent } from '../models/Agent.js';
import { paginatedResponse, errorResponse } from '../utils/response.js';

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const perPage = parseInt(req.query.per_page as string, 10) || 15;
    const search = (req.query.search as string || '').trim();
    const role = req.query.role as string;

    const query: Record<string, any> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role && role !== 'all') {
      query.roles = role;
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .populate('agentId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const formatted = users.map((u) => {
      const json = u.toJSON();
      const ag = u.agentId as any;
      return {
        ...json,
        two_factor_enabled: !!u.twoFactorConfirmedAt,
        two_factor_confirmed_at: u.twoFactorConfirmedAt ? u.twoFactorConfirmedAt.toISOString() : null,
        is_agent: !!ag,
        agent: ag ? { id: ag.id, name: ag.name, employee_code: ag.employeeCode } : null,
      };
    });

    paginatedResponse(res, formatted, total, page, perPage, '/api/v1/admin/users');
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password, role, agent_id } = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(8),
      role: z.string().default('admin'),
      agent_id: z.string().nullable().optional(),
    }).parse(req.body);

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      errorResponse(res, 'A user with that email already exists.', 422, {
        email: ['The email has already been taken.'],
      });
      return;
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      roles: [role],
      agentId: agent_id || null,
    });

    if (agent_id) {
      await Agent.findByIdAndUpdate(agent_id, { userId: user._id });
    }

    res.status(201).json({
      message: 'Admin user created successfully.',
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function showUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.params.id).populate('agentId');
    if (!user) {
      errorResponse(res, 'User not found', 404);
      return;
    }
    res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.id;
    const { name, email, role, agent_id } = z.object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      role: z.string().optional(),
      agent_id: z.string().nullable().optional(),
    }).parse(req.body);

    const user = await User.findById(userId);
    if (!user) {
      errorResponse(res, 'User not found', 404);
      return;
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (role) user.roles = [role];
    if (agent_id !== undefined) user.agentId = agent_id as any;

    await user.save();
    res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      errorResponse(res, 'User not found', 404);
      return;
    }

    if (user.agentId) {
      await Agent.findByIdAndUpdate(user.agentId, { userId: null });
    }

    await user.deleteOne();
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.id;
    const { role } = z.object({ role: z.string() }).parse(req.body);

    const user = await User.findById(userId);
    if (!user) {
      errorResponse(res, 'User not found', 404);
      return;
    }

    user.roles = [role];
    await user.save();

    res.status(200).json({ message: 'User role updated successfully.', user });
  } catch (error) {
    next(error);
  }
}

export async function resetTwoFactor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      errorResponse(res, 'User not found', 404);
      return;
    }

    user.twoFactorSecret = null;
    user.twoFactorConfirmedAt = null;
    user.twoFactorRecoveryCodes = [];
    await user.save();

    res.status(200).json({ message: 'Two-factor authentication reset successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.id;
    const { password } = z.object({
      password: z.string().min(8),
    }).parse(req.body);

    const user = await User.findById(userId);
    if (!user) {
      errorResponse(res, 'User not found', 404);
      return;
    }

    user.password = password;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    next(error);
  }
}
