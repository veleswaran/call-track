import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { CallEscalation } from '../models/CallEscalation.js';
import { CallLog } from '../models/CallLog.js';
import { Agent } from '../models/Agent.js';
import { Contact } from '../models/Contact.js';
import { CallClassification } from '../models/CallClassification.js';
import { generateCsv } from '../utils/csv.js';

export async function getEscalations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const perPage = parseInt(req.query.per_page as string, 10) || 15;
    const status = req.query.status as string;
    const agentId = req.query.agent_id as string;
    const dateFrom = req.query.date_from as string;
    const dateTo = req.query.date_to as string;

    const query: Record<string, any> = {};

    if (status && status !== 'all') {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }

    // Filter by date range on CallEscalation createdAt or callLog timestamp
    if (dateFrom && dateTo) {
      query.createdAt = {
        $gte: new Date(dateFrom),
        $lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999)),
      };
    } else if (dateFrom) {
      query.createdAt = { $gte: new Date(dateFrom) };
    } else if (dateTo) {
      query.createdAt = { $lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999)) };
    }

    const total = await CallEscalation.countDocuments(query);
    const escalations = await CallEscalation.find(query)
      .populate({
        path: 'callLogId',
        populate: [{ path: 'deviceId' }, { path: 'agentId' }],
      })
      .populate({
        path: 'resolvedByCallId',
        populate: [{ path: 'deviceId' }, { path: 'agentId' }],
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    // Compute summaries
    const allEscalations = await CallEscalation.find(query).populate('callLogId');
    const summary = {
      total_missed: allEscalations.length,
      active_missed: allEscalations.filter((e) => e.status === 'pending' || e.status === 'unattended').length,
      pending: allEscalations.filter((e) => e.status === 'pending').length,
      unattended: allEscalations.filter((e) => e.status === 'unattended').length,
      resolved: allEscalations.filter((e) => e.status === 'resolved').length,
    };

    // Agent summary
    const agentMap = new Map<string, any>();
    for (const esc of allEscalations) {
      const log = esc.callLogId as any;
      if (log && log.agentId) {
        const agId = log.agentId.toString();
        if (!agentMap.has(agId)) {
          agentMap.set(agId, {
            agent_id: agId,
            agent_name: 'Agent',
            employee_code: null,
            total_missed: 0,
            pending: 0,
            unattended: 0,
            resolved: 0,
          });
        }
        const agSummary = agentMap.get(agId);
        agSummary.total_missed++;
        if (esc.status === 'pending') agSummary.pending++;
        if (esc.status === 'unattended') agSummary.unattended++;
        if (esc.status === 'resolved') agSummary.resolved++;
      }
    }

    // Populate agent names in agent_summary
    const agents = await Agent.find({ _id: { $in: Array.from(agentMap.keys()) } });
    for (const ag of agents) {
      const summaryItem = agentMap.get(ag.id);
      if (summaryItem) {
        summaryItem.agent_name = ag.name;
        summaryItem.employee_code = ag.employeeCode;
      }
    }

    const formattedData = escalations.map((esc) => {
      const log = esc.callLogId as any;
      const resLog = esc.resolvedByCallId as any;

      return {
        id: esc.id,
        status: esc.status,
        response_due_at: esc.responseDueAt ? esc.responseDueAt.toISOString() : null,
        resolved_at: esc.resolvedAt ? esc.resolvedAt.toISOString() : null,
        call_log: log
          ? {
              id: log.id,
              device_id: log.deviceId ? (log.deviceId.id || log.deviceId.toString()) : '',
              sim_slot: log.simSlot,
              device_name: log.deviceId?.deviceName || null,
              agent_name: log.agentId?.name || null,
              phone_number: log.phoneNumber,
              call_type: (log.direction || '').toLowerCase(),
              call_outcome: log.callOutcome,
              duration: log.duration,
              timestamp: log.timestamp ? log.timestamp.toISOString() : null,
              phone_contact_name: log.phoneContactName,
              contact_name: null,
              contact_notes: null,
              is_internal: false,
              classification: null,
              created_at: log.createdAt,
            }
          : null,
        resolved_by_call: resLog
          ? {
              id: resLog.id,
              device_id: resLog.deviceId ? (resLog.deviceId.id || resLog.deviceId.toString()) : '',
              sim_slot: resLog.simSlot,
              phone_number: resLog.phoneNumber,
              call_type: (resLog.direction || '').toLowerCase(),
              duration: resLog.duration,
              timestamp: resLog.timestamp ? resLog.timestamp.toISOString() : null,
            }
          : null,
        created_at: esc.createdAt,
        updated_at: esc.updatedAt,
      };
    });

    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const from = total > 0 ? (page - 1) * perPage + 1 : null;
    const to = total > 0 ? Math.min(page * perPage, total) : null;

    res.status(200).json({
      data: formattedData,
      meta: {
        current_page: page,
        from,
        last_page: lastPage,
        per_page: perPage,
        to,
        total,
        summary,
        agent_summary: Array.from(agentMap.values()),
      },
      links: {
        first: `/api/v1/admin/call-logs/escalations?page=1`,
        last: `/api/v1/admin/call-logs/escalations?page=${lastPage}`,
        prev: page > 1 ? `/api/v1/admin/call-logs/escalations?page=${page - 1}` : null,
        next: page < lastPage ? `/api/v1/admin/call-logs/escalations?page=${page + 1}` : null,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function exportEscalations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const escalations = await CallEscalation.find()
      .populate({
        path: 'callLogId',
        populate: [{ path: 'deviceId' }, { path: 'agentId' }],
      })
      .sort({ createdAt: -1 })
      .limit(5000);

    const exportData = escalations.map((esc) => {
      const log = esc.callLogId as any;
      return {
        id: esc.id,
        status: esc.status,
        responseDueAt: esc.responseDueAt ? esc.responseDueAt.toISOString() : '',
        resolvedAt: esc.resolvedAt ? esc.resolvedAt.toISOString() : '',
        phoneNumber: log?.phoneNumber || '',
        contactName: log?.phoneContactName || '',
        agentName: log?.agentId?.name || '',
        deviceName: log?.deviceId?.deviceName || '',
        timestamp: log?.timestamp ? log.timestamp.toISOString() : '',
      };
    });

    const csvString = generateCsv(exportData, [
      { key: 'id', label: 'ID' },
      { key: 'status', label: 'Status' },
      { key: 'responseDueAt', label: 'Response Due At' },
      { key: 'resolvedAt', label: 'Resolved At' },
      { key: 'phoneNumber', label: 'Phone Number' },
      { key: 'contactName', label: 'Contact Name' },
      { key: 'agentName', label: 'Agent' },
      { key: 'deviceName', label: 'Device' },
      { key: 'timestamp', label: 'Call Time' },
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="missed-calls-escalations-${Date.now()}.csv"`);
    res.status(200).send(csvString);
  } catch (error) {
    next(error);
  }
}
