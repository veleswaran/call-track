import { Request, Response, NextFunction } from 'express';
import { CallLog } from '../models/CallLog.js';
import { CallClassification } from '../models/CallClassification.js';
import { CallEscalation } from '../models/CallEscalation.js';
import { Device } from '../models/Device.js';
import { Agent } from '../models/Agent.js';

export async function getDashboardMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const totalCalls = await CallLog.countDocuments();
    const totalDevices = await Device.countDocuments({ isArchived: false });
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeDevices = await Device.countDocuments({
      isArchived: false,
      lastHeartbeatAt: { $gte: oneDayAgo },
    });
    const totalAgents = await Agent.countDocuments({ status: 'active' });

    // Classification counts
    const businessCalls = await CallClassification.countDocuments({ type: 'business' });
    const personalCalls = await CallClassification.countDocuments({ type: 'personal' });
    const ignoredCalls = await CallClassification.countDocuments({ type: 'ignored' });
    const classifiedCount = businessCalls + personalCalls + ignoredCalls;
    const unclassifiedCalls = Math.max(0, totalCalls - classifiedCount);

    // Call duration aggregations
    const durationAgg = await CallLog.aggregate([
      {
        $group: {
          _id: null,
          totalDuration: { $sum: '$duration' },
          avgDuration: { $avg: '$duration' },
        },
      },
    ]);

    const totalDurationSeconds = durationAgg[0]?.totalDuration || 0;
    const averageCallDurationSeconds = durationAgg[0]?.avgDuration || 0;

    // Escalations
    const pendingEscalations = await CallEscalation.countDocuments({ status: 'pending' });
    const unattendedEscalations = await CallEscalation.countDocuments({ status: 'unattended' });
    const resolvedEscalations = await CallEscalation.countDocuments({ status: 'resolved' });

    // Missed calls
    const missedCalls = await CallLog.countDocuments({
      $or: [
        { direction: { $in: ['MISSED', 'REJECTED', 'BLOCKED'] } },
        { direction: 'INCOMING', duration: { $lte: 0 } },
      ],
    });

    res.status(200).json({
      data: {
        total_calls: totalCalls,
        business_calls: businessCalls,
        personal_calls: personalCalls,
        ignored_calls: ignoredCalls,
        unclassified_calls: unclassifiedCalls,
        total_devices: totalDevices,
        active_devices: activeDevices,
        missed_calls: missedCalls,
        total_missed_calls: missedCalls,
        total_agents: totalAgents,
        total_duration_seconds: totalDurationSeconds,
        average_call_duration_seconds: Math.round(averageCallDurationSeconds * 100) / 100,
        pending_escalations: pendingEscalations,
        unattended_escalations: unattendedEscalations,
        resolved_escalations: resolvedEscalations,
        total_calls_change_percent: 0,
        active_devices_change_percent: 0,
        missed_calls_change_percent: 0,
        average_call_duration_change_percent: 0,
        total_duration_change_percent: 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardCharts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const callsByDay = await CallLog.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          total: { $sum: 1 },
          connected: {
            $sum: { $cond: [{ $gt: ['$duration', 0] }, 1, 0] },
          },
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

    res.status(200).json({
      data: {
        calls_by_day: callsByDay.map((item) => ({
          date: item._id,
          total: item.total,
          connected: item.connected,
          missed: item.missed,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}
