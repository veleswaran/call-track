import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { CallLog } from '../models/CallLog.js';
import { CallClassification } from '../models/CallClassification.js';
import { CallEscalation } from '../models/CallEscalation.js';
import { Device } from '../models/Device.js';
import { DeviceSyncLog } from '../models/DeviceEvent.js';
import { Contact } from '../models/Contact.js';
import { Agent } from '../models/Agent.js';
import { normalizePhoneNumber, hashString } from '../utils/hashing.js';
import { paginatedResponse, errorResponse } from '../utils/response.js';
import { generateCsv } from '../utils/csv.js';

const syncSchema = z.object({
  logs: z.array(
    z.object({
      call_hash: z.string(),
      phone_number: z.string(),
      phone_contact_name: z.string().nullable().optional(),
      direction: z.string(),
      duration: z.number().or(z.string()).transform((v) => Number(v) || 0),
      timestamp: z.string().or(z.number()),
      sim_slot: z.number().or(z.string()).nullable().optional().transform((v) => (v !== undefined && v !== null ? Number(v) : null)),
      extra: z.record(z.any()).nullable().optional(),
    })
  ),
  battery_level: z.number().or(z.string()).nullable().optional().transform((v) => (v !== undefined && v !== null ? Number(v) : null)),
  app_version: z.string().nullable().optional(),
});

export async function syncCallLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const device = req.device!;
    const { logs, battery_level, app_version } = syncSchema.parse(req.body);

    const trackedSlots = device.trackedSimSlots;
    const FALLBACK_SIM_SLOT = 0;
    let skippedCount = 0;
    const skippedSlots: number[] = [];

    const toInsertLogs: any[] = [];
    const classificationMap = new Map<string, any>();

    for (const log of logs) {
      const simSlot = log.sim_slot !== null ? log.sim_slot : FALLBACK_SIM_SLOT;

      // Filter by tracked SIM slots if configured
      if (trackedSlots && trackedSlots.length > 0 && !trackedSlots.includes(simSlot) && simSlot !== FALLBACK_SIM_SLOT) {
        skippedCount++;
        if (!skippedSlots.includes(simSlot)) {
          skippedSlots.push(simSlot);
        }
        continue;
      }

      const normalizedPhone = normalizePhoneNumber(log.phone_number);
      const phoneNumberHash = hashString(normalizedPhone);
      const upperDirection = (log.direction || 'UNKNOWN').toUpperCase();
      const dateTimestamp = new Date(log.timestamp);

      toInsertLogs.push({
        deviceId: device._id,
        agentId: device.agentId || null,
        callHash: log.call_hash,
        phoneNumber: log.phone_number,
        phoneNumberHash,
        phoneContactName: log.phone_contact_name || null,
        simSlot,
        direction: upperDirection,
        duration: log.duration,
        timestamp: dateTimestamp,
        rawData: log.extra || null,
      });

      if (log.extra && (log.extra.classification || log.extra.note)) {
        classificationMap.set(log.call_hash, {
          type: (log.extra.classification || 'business').toLowerCase(),
          note: log.extra.note || null,
          metadata: log.extra.metadata || null,
        });
      }
    }

    let ingestedCount = 0;

    for (const record of toInsertLogs) {
      try {
        const existing = await CallLog.findOne({ callHash: record.callHash });
        if (!existing) {
          const createdLog = await CallLog.create(record);
          ingestedCount++;

          // If extra classification was passed, insert classification
          if (classificationMap.has(record.callHash)) {
            const classInfo = classificationMap.get(record.callHash);
            await CallClassification.create({
              callLogId: createdLog._id,
              agentId: device.agentId || null,
              type: classInfo.type,
              note: classInfo.note,
              metadata: classInfo.metadata,
            });
          }

          // Check if missed call escalation needs to be created or resolved
          const isMissed = ['MISSED', 'REJECTED', 'BLOCKED'].includes(record.direction) ||
            (record.direction === 'INCOMING' && record.duration <= 0);

          if (isMissed) {
            // Create escalation with 15-min SLA
            const responseDueAt = new Date(record.timestamp.getTime() + 15 * 60 * 1000);
            await CallEscalation.create({
              callLogId: createdLog._id,
              status: 'pending',
              responseDueAt,
            });
          } else if (record.direction === 'OUTGOING' && record.duration > 0) {
            // Outgoing call resolved any pending escalation for this phone number!
            const pendingEscalations = await CallEscalation.find({ status: 'pending' })
              .populate({
                path: 'callLogId',
                match: { phoneNumberHash: record.phoneNumberHash },
              });

            for (const esc of pendingEscalations) {
              if (esc.callLogId) {
                esc.status = 'resolved';
                esc.resolvedAt = record.timestamp;
                esc.resolvedByCallId = createdLog._id;
                await esc.save();
              }
            }
          }
        }
      } catch (err) {
        // Ignore duplicate key error on callHash
      }
    }

    // Update device stats
    device.lastSyncAt = new Date();
    if (battery_level !== null && battery_level !== undefined) {
      device.batteryLevel = battery_level;
    }
    if (app_version) {
      device.appVersion = app_version;
    }
    await device.save();

    // Record sync log
    await DeviceSyncLog.create({
      deviceId: device._id,
      syncedCount: ingestedCount,
      batteryLevel: battery_level,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    const responsePayload: Record<string, any> = {
      message: 'Logs synced successfully',
      ingested: ingestedCount,
    };

    if (skippedCount > 0) {
      responsePayload.warning = `Skipped ${skippedCount} log(s) from untracked SIM slot(s): ${skippedSlots.join(', ')}`;
    }

    res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
}

export async function deviceClassifyCall(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const device = req.device!;
    const callHash = req.params.callHash;
    const { classification, note, metadata } = z.object({
      classification: z.enum(['business', 'personal', 'ignored']),
      note: z.string().nullable().optional(),
      metadata: z.record(z.any()).nullable().optional(),
    }).parse(req.body);

    const callLog = await CallLog.findOne({ callHash });
    if (!callLog) {
      errorResponse(res, 'Call log not found.', 404);
      return;
    }

    let existing = await CallClassification.findOne({ callLogId: callLog._id });
    if (!existing) {
      existing = new CallClassification({
        callLogId: callLog._id,
        agentId: device.agentId || null,
        type: classification,
        note: note || null,
        metadata: metadata || null,
      });
    } else {
      existing.type = classification;
      if (note !== undefined) existing.note = note;
      if (metadata !== undefined) existing.metadata = metadata;
      if (device.agentId) existing.agentId = device.agentId;
    }
    await existing.save();

    res.status(200).json({
      message: 'Call classified successfully',
      data: existing,
    });
  } catch (error) {
    next(error);
  }
}

export async function adminClassifyCall(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const callLogId = req.params.id;
    const { type, note, metadata } = z.object({
      type: z.enum(['business', 'personal', 'ignored']),
      note: z.string().nullable().optional(),
      metadata: z.record(z.any()).nullable().optional(),
    }).parse(req.body);

    const callLog = await CallLog.findById(callLogId);
    if (!callLog) {
      errorResponse(res, 'Call log not found.', 404);
      return;
    }

    let classification = await CallClassification.findOne({ callLogId: callLog._id });
    if (!classification) {
      classification = new CallClassification({
        callLogId: callLog._id,
        userId: req.user!._id,
        type,
        note: note || null,
        metadata: metadata || null,
      });
    } else {
      classification.type = type;
      classification.userId = req.user!._id;
      if (note !== undefined) classification.note = note;
      if (metadata !== undefined) classification.metadata = metadata;
    }
    await classification.save();

    res.status(200).json({ message: 'Call classified successfully' });
  } catch (error) {
    next(error);
  }
}

export async function listAdminCallLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const perPage = parseInt(req.query.per_page as string, 10) || 15;
    const search = (req.query.search as string || '').trim();
    const dateFrom = req.query.date_from as string;
    const dateTo = req.query.date_to as string;
    const agentId = req.query.agent_id as string;
    const deviceId = req.query.device_id as string;
    const type = req.query.type as string;
    const simSlot = req.query.sim_slot !== undefined && req.query.sim_slot !== '' ? Number(req.query.sim_slot) : null;

    const query: Record<string, any> = {};

    if (dateFrom && dateTo) {
      query.timestamp = {
        $gte: new Date(dateFrom),
        $lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999)),
      };
    } else if (dateFrom) {
      query.timestamp = { $gte: new Date(dateFrom) };
    } else if (dateTo) {
      query.timestamp = { $lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999)) };
    }

    if (agentId && agentId !== 'all') {
      query.agentId = new mongoose.Types.ObjectId(agentId);
    }

    if (deviceId && deviceId !== 'all') {
      query.deviceId = new mongoose.Types.ObjectId(deviceId);
    }

    if (type && type !== 'all') {
      query.direction = type.toUpperCase();
    }

    if (simSlot !== null && !isNaN(simSlot)) {
      query.simSlot = simSlot;
    }

    if (search) {
      const normalizedSearch = normalizePhoneNumber(search);
      query.$or = [
        { phoneNumber: { $regex: search, $options: 'i' } },
        { phoneNumberHash: hashString(normalizedSearch) },
        { phoneContactName: { $regex: search, $options: 'i' } },
        { contactName: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await CallLog.countDocuments(query);
    const logs = await CallLog.find(query)
      .populate('deviceId')
      .populate('agentId')
      .sort({ timestamp: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    // Fetch classifications and contacts for these logs
    const logIds = logs.map((l) => l._id);
    const classifications = await CallClassification.find({ callLogId: { $in: logIds } });
    const classMap = new Map(classifications.map((c) => [c.callLogId.toString(), c]));

    const phoneHashes = logs.map((l) => l.phoneNumberHash).filter(Boolean);
    const contacts = await Contact.find({ phoneHash: { $in: phoneHashes } });
    const contactMap = new Map(contacts.map((c) => [c.phoneHash, c]));

    const formatted = logs.map((l) => {
      const dev = l.deviceId as any;
      const ag = l.agentId as any;
      const cls = classMap.get(l.id);
      const con = l.phoneNumberHash ? contactMap.get(l.phoneNumberHash) : null;

      return {
        id: l.id,
        device_id: dev ? dev.id : l.deviceId.toString(),
        sim_slot: l.simSlot,
        device_name: dev ? dev.deviceName : null,
        agent_name: ag ? ag.name : null,
        phone_number: l.phoneNumber,
        call_type: (l.direction || 'unknown').toLowerCase(),
        call_outcome: l.callOutcome,
        duration: l.duration,
        timestamp: l.timestamp.toISOString(),
        phone_contact_name: l.phoneContactName,
        contact_name: con ? con.name : null,
        contact_notes: con ? con.notes : null,
        is_internal: !!(con && con.isInternal),
        classification: cls
          ? {
              id: cls.id,
              classification: cls.type,
              classified_by: cls.userId ? cls.userId.toString() : cls.agentId ? cls.agentId.toString() : null,
              classified_at: cls.updatedAt || cls.createdAt,
              note: cls.note,
              metadata: cls.metadata,
            }
          : null,
        created_at: l.createdAt,
      };
    });

    paginatedResponse(res, formatted, total, page, perPage, '/api/v1/admin/call-logs');
  } catch (error) {
    next(error);
  }
}

export async function exportCallLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const logs = await CallLog.find()
      .populate('deviceId')
      .populate('agentId')
      .sort({ timestamp: -1 })
      .limit(5000);

    const logIds = logs.map((l) => l._id);
    const classifications = await CallClassification.find({ callLogId: { $in: logIds } });
    const classMap = new Map(classifications.map((c) => [c.callLogId.toString(), c]));

    const exportData = logs.map((l) => {
      const dev = l.deviceId as any;
      const ag = l.agentId as any;
      const cls = classMap.get(l.id);

      return {
        id: l.id,
        deviceName: dev?.deviceName || '',
        agentName: ag?.name || '',
        phoneNumber: l.phoneNumber,
        contactName: l.phoneContactName || '',
        direction: l.direction,
        callOutcome: l.callOutcome,
        durationSeconds: l.duration,
        simSlot: l.simSlot !== null ? l.simSlot : '',
        classification: cls?.type || 'unclassified',
        note: cls?.note || '',
        timestamp: l.timestamp.toISOString(),
      };
    });

    const csvString = generateCsv(exportData, [
      { key: 'id', label: 'ID' },
      { key: 'deviceName', label: 'Device' },
      { key: 'agentName', label: 'Agent' },
      { key: 'phoneNumber', label: 'Phone Number' },
      { key: 'contactName', label: 'Contact Name' },
      { key: 'direction', label: 'Direction' },
      { key: 'callOutcome', label: 'Outcome' },
      { key: 'durationSeconds', label: 'Duration (sec)' },
      { key: 'simSlot', label: 'SIM Slot' },
      { key: 'classification', label: 'Classification' },
      { key: 'note', label: 'Note' },
      { key: 'timestamp', label: 'Timestamp' },
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="call-logs-${Date.now()}.csv"`);
    res.status(200).send(csvString);
  } catch (error) {
    next(error);
  }
}
