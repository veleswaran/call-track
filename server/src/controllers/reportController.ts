import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { CallLog } from '../models/CallLog.js';
import { Agent } from '../models/Agent.js';
import { CallEscalation } from '../models/CallEscalation.js';
import { Team, TeamMember } from '../models/Team.js';

export async function getReportMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const totalCalls = await CallLog.countDocuments();
    const totalAgents = await Agent.countDocuments({ status: 'active' });

    const connectedCalls = await CallLog.countDocuments({
      duration: { $gt: 0 },
      direction: { $nin: ['MISSED', 'REJECTED', 'BLOCKED'] },
    });

    const missedCalls = await CallLog.countDocuments({
      $or: [
        { direction: { $in: ['MISSED', 'REJECTED', 'BLOCKED'] } },
        { direction: 'INCOMING', duration: { $lte: 0 } },
      ],
    });

    const noAnswerCalls = await CallLog.countDocuments({
      direction: 'OUTGOING',
      duration: 0,
    });

    const pendingEsc = await CallEscalation.countDocuments({ status: 'pending' });
    const unattendedEsc = await CallEscalation.countDocuments({ status: 'unattended' });
    const resolvedEsc = await CallEscalation.countDocuments({ status: 'resolved' });

    const total = totalCalls || 1;

    const data = [
      {
        label: 'Total Agents',
        value: String(totalAgents),
        icon: 'users',
        color: 'text-blue-500',
      },
      {
        label: 'Total Calls',
        value: String(totalCalls),
        icon: 'phone',
      },
      {
        label: 'Connected Calls',
        value: String(connectedCalls),
        percentage: Math.round((connectedCalls / total) * 1000) / 10,
        icon: 'check-circle',
        color: 'text-green-500',
      },
      {
        label: 'Missed Calls',
        value: String(missedCalls),
        percentage: Math.round((missedCalls / total) * 1000) / 10,
        icon: 'x-circle',
        color: 'text-red-500',
        sub_metrics: [
          { label: 'U', value: unattendedEsc, color: 'bg-red-500' },
          { label: 'P', value: pendingEsc, color: 'bg-amber-500' },
          { label: 'R', value: resolvedEsc, color: 'bg-emerald-500' },
          { label: 'T', value: missedCalls, color: 'bg-zinc-500' },
        ],
      },
      {
        label: 'No Answer',
        value: String(noAnswerCalls),
        percentage: Math.round((noAnswerCalls / total) * 1000) / 10,
        icon: 'phone-off',
        color: 'text-amber-500',
      },
    ];

    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getReportCharts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Calls per day
    const callsPerDayAgg = await CallLog.aggregate([
      { $match: { timestamp: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          total: { $sum: 1 },
          connected: { $sum: { $cond: [{ $gt: ['$duration', 0] }, 1, 0] } },
          missed: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $in: ['$direction', ['MISSED', 'REJECTED', 'BLOCKED']] },
                    { $and: [{ $eq: ['$direction', 'INCOMING'] }, { $lte: ['$duration', 0] }] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Direction distribution
    const dirAgg = await CallLog.aggregate([
      {
        $group: {
          _id: '$direction',
          count: { $sum: 1 },
        },
      },
    ]);

    // Peak hours
    const hoursAgg = await CallLog.aggregate([
      {
        $group: {
          _id: { $hour: '$timestamp' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const callsPerDay = callsPerDayAgg.map((item) => ({
      date: item._id,
      total: item.total,
      connected: item.connected,
      missed: item.missed,
    }));

    const statusDistribution = dirAgg.map((item) => ({
      name: item._id || 'UNKNOWN',
      value: item.count,
    }));

    const peakHours = Array.from({ length: 24 }, (_, i) => {
      const match = hoursAgg.find((h) => h._id === i);
      return {
        hour: `${i}:00`,
        calls: match ? match.count : 0,
      };
    });

    res.status(200).json({
      data: {
        calls_per_day: callsPerDay,
        status_distribution: statusDistribution,
        peak_call_hours: peakHours,
        caller_types: [],
        call_direction_distribution: statusDistribution,
        agent_distribution: [],
        team_distribution: [],
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getReportPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const perPage = parseInt(req.query.per_page as string, 10) || 15;

    const totalAgents = await Agent.countDocuments({ status: 'active' });
    const agents = await Agent.find({ status: 'active' })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const performance = await Promise.all(
      agents.map(async (ag) => {
        const totalCalls = await CallLog.countDocuments({ agentId: ag._id });
        const connectedCalls = await CallLog.countDocuments({
          agentId: ag._id,
          duration: { $gt: 0 },
        });
        const missedCalls = await CallLog.countDocuments({
          agentId: ag._id,
          $or: [
            { direction: { $in: ['MISSED', 'REJECTED', 'BLOCKED'] } },
            { direction: 'INCOMING', duration: { $lte: 0 } },
          ],
        });

        const durationAgg = await CallLog.aggregate([
          { $match: { agentId: ag._id } },
          {
            $group: {
              _id: null,
              totalDuration: { $sum: '$duration' },
              avgDuration: { $avg: '$duration' },
            },
          },
        ]);

        return {
          agent_id: ag.id,
          agent_name: ag.name,
          employee_code: ag.employeeCode,
          total_calls: totalCalls,
          connected_calls: connectedCalls,
          missed_calls: missedCalls,
          total_duration_seconds: durationAgg[0]?.totalDuration || 0,
          avg_duration_seconds: Math.round(durationAgg[0]?.avgDuration || 0),
        };
      })
    );

    res.status(200).json({
      data: performance,
      meta: {
        current_page: page,
        per_page: perPage,
        total: totalAgents,
        last_page: Math.max(1, Math.ceil(totalAgents / perPage)),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getReportDayWise(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const dayWiseAgg = await CallLog.aggregate([
      { $match: { timestamp: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          total_calls: { $sum: 1 },
          connected_calls: { $sum: { $cond: [{ $gt: ['$duration', 0] }, 1, 0] } },
          missed_calls: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $in: ['$direction', ['MISSED', 'REJECTED', 'BLOCKED']] },
                    { $and: [{ $eq: ['$direction', 'INCOMING'] }, { $lte: ['$duration', 0] }] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          total_duration: { $sum: '$duration' },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const result = dayWiseAgg.map((d) => ({
      date: d._id,
      total_calls: d.total_calls,
      connected_calls: d.connected_calls,
      missed_calls: d.missed_calls,
      total_duration_seconds: d.total_duration,
      avg_duration_seconds: d.total_calls > 0 ? Math.round(d.total_duration / d.total_calls) : 0,
    }));

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
