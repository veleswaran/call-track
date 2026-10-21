import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Agent } from '../models/Agent.js';
import { User } from '../models/User.js';
import { Device } from '../models/Device.js';
import { TeamMember } from '../models/Team.js';
import { paginatedResponse, errorResponse } from '../utils/response.js';

const agentSchema = z.object({
  name: z.string().min(1),
  employee_code: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
});

export async function listAgents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const perPage = parseInt(req.query.per_page as string, 10) || 20;
    const search = (req.query.search as string || '').trim();
    const status = req.query.status as string;

    const query: Record<string, any> = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Agent.countDocuments(query);
    const agents = await Agent.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const formatted = await Promise.all(
      agents.map(async (ag) => {
        const devicesCount = await Device.countDocuments({ agentId: ag._id, isArchived: false });
        const memberships = await TeamMember.find({ agentId: ag._id }).populate('teamId');
        const teams = memberships
          .map((m) => m.teamId as any)
          .filter(Boolean)
          .map((t) => ({ id: t.id, name: t.name }));

        return {
          id: ag.id,
          name: ag.name,
          employee_code: ag.employeeCode,
          status: ag.status,
          user_id: ag.userId ? ag.userId.toString() : null,
          devices_count: devicesCount,
          teams,
          created_at: ag.createdAt,
          updated_at: ag.updatedAt,
        };
      })
    );

    paginatedResponse(res, formatted, total, page, perPage, '/api/v1/admin/agents');
  } catch (error) {
    next(error);
  }
}

export async function createAgent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = agentSchema.parse(req.body);
    const agent = await Agent.create({
      name: data.name,
      employeeCode: data.employee_code || null,
      status: data.status,
      phone: data.phone || null,
      email: data.email || null,
    });

    res.status(201).json(agent);
  } catch (error) {
    next(error);
  }
}

export async function showAgent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      errorResponse(res, 'Agent not found', 404);
      return;
    }
    res.status(200).json({ data: agent });
  } catch (error) {
    next(error);
  }
}

export async function updateAgent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = agentSchema.partial().parse(req.body);
    const agent = await Agent.findById(req.params.id || req.params.agent);
    if (!agent) {
      errorResponse(res, 'Agent not found', 404);
      return;
    }

    if (data.name !== undefined) agent.name = data.name;
    if (data.employee_code !== undefined) agent.employeeCode = data.employee_code;
    if (data.status !== undefined) agent.status = data.status;
    if (data.phone !== undefined) agent.phone = data.phone;
    if (data.email !== undefined) agent.email = data.email;

    await agent.save();
    res.status(200).json(agent);
  } catch (error) {
    next(error);
  }
}

export async function deleteAgent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      errorResponse(res, 'Agent not found', 404);
      return;
    }

    // Unassign devices
    await Device.updateMany({ agentId: agent._id }, { agentId: null });
    // Remove team memberships
    await TeamMember.deleteMany({ agentId: agent._id });

    await agent.deleteOne();
    res.status(200).json({ message: 'Agent deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function linkUserToAgent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const agentId = req.params.agent;
    const { user_id } = z.object({ user_id: z.string() }).parse(req.body);

    const agent = await Agent.findById(agentId);
    if (!agent) {
      errorResponse(res, 'Agent not found', 404);
      return;
    }

    const user = await User.findById(user_id);
    if (!user) {
      errorResponse(res, 'User not found', 404);
      return;
    }

    agent.userId = user._id;
    await agent.save();

    user.agentId = agent._id;
    await user.save();

    res.status(200).json({ message: 'User linked to agent successfully' });
  } catch (error) {
    next(error);
  }
}

export async function unlinkUserFromAgent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const agentId = req.params.agent;
    const agent = await Agent.findById(agentId);
    if (!agent) {
      errorResponse(res, 'Agent not found', 404);
      return;
    }

    if (agent.userId) {
      await User.findByIdAndUpdate(agent.userId, { agentId: null });
    }

    agent.userId = null;
    await agent.save();

    res.status(200).json({ message: 'User unlinked from agent successfully' });
  } catch (error) {
    next(error);
  }
}
