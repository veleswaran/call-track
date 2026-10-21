import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Team, TeamMember } from '../models/Team.js';
import { Agent } from '../models/Agent.js';
import { paginatedResponse, errorResponse } from '../utils/response.js';

export async function listTeams(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const perPage = parseInt(req.query.per_page as string, 10) || 20;
    const search = (req.query.search as string || '').trim();

    const query: Record<string, any> = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const total = await Team.countDocuments(query);
    const teams = await Team.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const formatted = await Promise.all(
      teams.map(async (t) => {
        const members = await TeamMember.find({ teamId: t._id }).populate('agentId');
        const membersCount = members.length;
        const managersCount = members.filter((m) => m.role === 'MANAGER').length;

        return {
          id: t.id,
          name: t.name,
          description: t.description,
          members_count: membersCount,
          managers_count: managersCount,
          members: members.map((m) => {
            const ag = m.agentId as any;
            return {
              id: m.id,
              team_id: t.id,
              agent_id: ag ? ag.id : m.agentId.toString(),
              role: m.role,
              agent: ag ? { id: ag.id, name: ag.name, employee_code: ag.employeeCode } : null,
              created_at: m.createdAt,
              updated_at: m.updatedAt,
            };
          }),
          created_at: t.createdAt,
          updated_at: t.updatedAt,
        };
      })
    );

    paginatedResponse(res, formatted, total, page, perPage, '/api/v1/admin/teams');
  } catch (error) {
    next(error);
  }
}

export async function showTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = req.params.team;
    const team = await Team.findById(teamId);
    if (!team) {
      errorResponse(res, 'Team not found', 404);
      return;
    }

    const members = await TeamMember.find({ teamId: team._id }).populate('agentId');
    const membersCount = members.length;
    const managersCount = members.filter((m) => m.role === 'MANAGER').length;

    res.status(200).json({
      data: {
        id: team.id,
        name: team.name,
        description: team.description,
        members_count: membersCount,
        managers_count: managersCount,
        members: members.map((m) => {
          const ag = m.agentId as any;
          return {
            id: m.id,
            team_id: team.id,
            agent_id: ag ? ag.id : m.agentId.toString(),
            role: m.role,
            agent: ag ? { id: ag.id, name: ag.name, employee_code: ag.employeeCode } : null,
            created_at: m.createdAt,
            updated_at: m.updatedAt,
          };
        }),
        created_at: team.createdAt,
        updated_at: team.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, description } = z.object({
      name: z.string().min(1),
      description: z.string().nullable().optional(),
    }).parse(req.body);

    const team = await Team.create({
      name,
      description: description || null,
    });

    res.status(201).json({
      data: team,
      message: 'Team created successfully.',
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = req.params.team;
    const { name, description } = z.object({
      name: z.string().min(1).optional(),
      description: z.string().nullable().optional(),
    }).parse(req.body);

    const team = await Team.findById(teamId);
    if (!team) {
      errorResponse(res, 'Team not found', 404);
      return;
    }

    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    await team.save();

    res.status(200).json({
      data: team,
      message: 'Team updated successfully.',
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = req.params.team;
    const team = await Team.findById(teamId);
    if (!team) {
      errorResponse(res, 'Team not found', 404);
      return;
    }

    await TeamMember.deleteMany({ teamId: team._id });
    await team.deleteOne();

    res.status(200).json({ message: 'Team deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function addTeamMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = req.params.team;
    const { agent_id, role } = z.object({
      agent_id: z.string().or(z.number()),
      role: z.enum(['MEMBER', 'MANAGER']).default('MEMBER'),
    }).parse(req.body);

    const team = await Team.findById(teamId);
    if (!team) {
      errorResponse(res, 'Team not found', 404);
      return;
    }

    const agent = await Agent.findById(agent_id);
    if (!agent) {
      errorResponse(res, 'Agent not found', 404);
      return;
    }

    let member = await TeamMember.findOne({ teamId: team._id, agentId: agent._id });
    if (!member) {
      member = await TeamMember.create({
        teamId: team._id,
        agentId: agent._id,
        role,
      });
    } else {
      member.role = role;
      await member.save();
    }

    res.status(200).json({
      message: 'Agent added to team successfully.',
      data: member,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeTeamMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = req.params.team;
    const agentId = req.params.agent;

    await TeamMember.findOneAndDelete({ teamId, agentId });
    res.status(200).json({ message: 'Agent removed from team successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function updateTeamMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = req.params.team;
    const agentId = req.params.agent;
    const { role } = z.object({ role: z.enum(['MEMBER', 'MANAGER']) }).parse(req.body);

    const member = await TeamMember.findOne({ teamId, agentId });
    if (!member) {
      errorResponse(res, 'Team member not found', 404);
      return;
    }

    member.role = role;
    await member.save();

    res.status(200).json({
      message: 'Team member role updated successfully.',
      data: member,
    });
  } catch (error) {
    next(error);
  }
}
