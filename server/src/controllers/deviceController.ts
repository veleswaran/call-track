import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Device } from '../models/Device.js';
import { DeviceToken } from '../models/DeviceToken.js';
import { DeviceRegistrationCode } from '../models/DeviceRegistrationCode.js';
import { DeviceEvent } from '../models/DeviceEvent.js';
import { Agent } from '../models/Agent.js';
import { hashString, generateRandomToken } from '../utils/hashing.js';
import { paginatedResponse, errorResponse } from '../utils/response.js';

// Open Device Registration (or via Registration Code)
const registerSchema = z.object({
  device_uuid: z.string().optional(),
  device_identifier: z.string().optional(),
  device_name: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  device_model: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  os_version: z.string().nullable().optional(),
  app_version: z.string().nullable().optional(),
  tracked_sim_slots: z.array(z.number()).nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
  code: z.string().optional(),
  registration_code: z.string().optional(),
});

export async function registerDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);
    const codeStr = (data.code || data.registration_code || '').trim();

    let assignedAgentId: mongoose.Types.ObjectId | null = null;
    let registrationCodeDoc: any = null;

    if (codeStr) {
      registrationCodeDoc = await DeviceRegistrationCode.findOne({
        code: codeStr.toUpperCase(),
        usedAt: null,
      });

      if (!registrationCodeDoc) {
        errorResponse(res, 'Invalid or expired registration code.', 422, {
          code: ['The selected registration code is invalid or has already been used.'],
        });
        return;
      }

      if (registrationCodeDoc.expiresAt && registrationCodeDoc.expiresAt < new Date()) {
        errorResponse(res, 'Registration code has expired.', 422, {
          code: ['The registration code has expired.'],
        });
        return;
      }

      assignedAgentId = registrationCodeDoc.agentId || null;
    }

    const deviceUuid = data.device_uuid || uuidv4();
    const deviceIdentifier = data.device_identifier || deviceUuid;
    const deviceName = data.device_name || data.name || 'Android Device';
    const deviceModel = data.device_model || data.model || null;

    let device = await Device.findOne({
      $or: [{ deviceUuid }, { deviceIdentifier }],
    });

    if (!device) {
      device = new Device({
        deviceIdentifier,
        deviceUuid,
        deviceName,
        deviceModel,
        osVersion: data.os_version || null,
        appVersion: data.app_version || null,
        trackedSimSlots: data.tracked_sim_slots || null,
        metadata: data.metadata || null,
        agentId: assignedAgentId,
        status: 'active',
      });
      await device.save();
    } else {
      device.deviceName = deviceName;
      if (deviceModel) device.deviceModel = deviceModel;
      if (data.os_version) device.osVersion = data.os_version;
      if (data.app_version) device.appVersion = data.app_version;
      if (data.tracked_sim_slots !== undefined) device.trackedSimSlots = data.tracked_sim_slots;
      if (data.metadata) device.metadata = data.metadata;
      if (assignedAgentId) device.agentId = assignedAgentId;
      await device.save();
    }

    // Mark registration code used
    if (registrationCodeDoc) {
      registrationCodeDoc.usedAt = new Date();
      registrationCodeDoc.deviceId = device._id;
      await registrationCodeDoc.save();
    }

    // Generate stateless device token
    const plainTextToken = generateRandomToken(40);
    const tokenHash = hashString(plainTextToken);

    await DeviceToken.create({
      deviceId: device._id,
      token: plainTextToken,
      tokenHash,
      expiresAt: null,
      lastUsedAt: new Date(),
    });

    res.status(201).json({
      message: 'Device registered successfully',
      device_id: device.id,
      device_uuid: device.deviceUuid,
      device: {
        id: device.id,
        name: device.deviceName,
        metadata: device.metadata,
      },
      token: plainTextToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function listAdminDevices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const perPage = parseInt(req.query.per_page as string, 10) || 15;
    const search = (req.query.search as string || '').trim();
    const status = req.query.status as string;

    const query: Record<string, any> = { isArchived: false };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { deviceName: { $regex: search, $options: 'i' } },
        { deviceModel: { $regex: search, $options: 'i' } },
        { deviceIdentifier: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Device.countDocuments(query);
    const devices = await Device.find(query)
      .populate('agentId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const formatted = devices.map((d) => {
      const json = d.toJSON();
      const agentDoc = d.agentId as any;
      return {
        ...json,
        agent: agentDoc
          ? {
              id: agentDoc.id || agentDoc._id.toString(),
              name: agentDoc.name,
            }
          : null,
      };
    });

    paginatedResponse(res, formatted, total, page, perPage, '/api/v1/admin/devices');
  } catch (error) {
    next(error);
  }
}

export async function generateDeviceCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { agent_id, expires_in_hours } = z.object({
      agent_id: z.string().or(z.number()),
      expires_in_hours: z.number().nullable().optional(),
    }).parse(req.body);

    const agent = await Agent.findById(agent_id);
    if (!agent) {
      errorResponse(res, 'The selected agent is invalid.', 422, {
        agent_id: ['The selected agent does not exist.'],
      });
      return;
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const hours = expires_in_hours || 48;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    const registrationCode = await DeviceRegistrationCode.create({
      code,
      agentId: agent._id,
      expiresAt,
    });

    res.status(201).json({
      data: {
        code: registrationCode.code,
        expires_at: registrationCode.expiresAt,
        agent_id: agent.id,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listDeviceCodes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const codes = await DeviceRegistrationCode.find({
      usedAt: null,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    })
      .populate('agentId')
      .sort({ createdAt: -1 });

    res.status(200).json(codes);
  } catch (error) {
    next(error);
  }
}

export async function assignAgentToDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deviceId = req.params.device;
    const { agent_id } = z.object({ agent_id: z.string().or(z.number()) }).parse(req.body);

    const device = await Device.findById(deviceId);
    if (!device) {
      errorResponse(res, 'Device not found.', 404);
      return;
    }

    const agent = await Agent.findById(agent_id);
    if (!agent) {
      errorResponse(res, 'Agent not found.', 404);
      return;
    }

    device.agentId = agent._id;
    await device.save();

    res.status(200).json({
      message: 'Device assigned to agent successfully',
      device_id: device.id,
      agent_id: agent.id,
    });
  } catch (error) {
    next(error);
  }
}

export async function unassignAgentFromDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deviceId = req.params.device;
    const device = await Device.findById(deviceId);
    if (!device) {
      errorResponse(res, 'Device not found.', 404);
      return;
    }

    device.agentId = null;
    await device.save();

    res.status(200).json({
      message: 'Device unassigned from agent successfully',
      device_id: device.id,
    });
  } catch (error) {
    next(error);
  }
}

export async function revokeDeviceTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deviceId = req.params.device;
    const device = await Device.findById(deviceId);
    if (!device) {
      errorResponse(res, 'Device not found.', 404);
      return;
    }

    const result = await DeviceToken.updateMany(
      { deviceId: device._id, revokedAt: null },
      { revokedAt: new Date() }
    );

    res.status(200).json({
      message: 'Tokens revoked successfully.',
      revoked_count: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
}

export async function listDeviceEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deviceId = req.params.device;
    const events = await DeviceEvent.find({ deviceId }).sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ data: events });
  } catch (error) {
    next(error);
  }
}

export async function storeDeviceEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const device = req.device!;
    const { event_type, payload } = z.object({
      event_type: z.string(),
      payload: z.record(z.any()).nullable().optional(),
    }).parse(req.body);

    const event = await DeviceEvent.create({
      deviceId: device._id,
      eventType: event_type,
      payload: payload || null,
      occurredAt: new Date(),
    });

    device.lastHeartbeatAt = new Date();
    await device.save();

    res.status(200).json({ message: 'Event recorded', data: event });
  } catch (error) {
    next(error);
  }
}

export async function updateFcmToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const device = req.device!;
    const { fcm_token } = z.object({ fcm_token: z.string() }).parse(req.body);

    device.fcmToken = fcm_token;
    await device.save();

    res.status(200).json({ message: 'FCM token updated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function sendDevicePush(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deviceId = req.params.device;
    const device = await Device.findById(deviceId);
    if (!device) {
      errorResponse(res, 'Device not found', 404);
      return;
    }

    // Push notification simulation / queue
    res.status(200).json({
      message: 'Push notification queued for device',
    });
  } catch (error) {
    next(error);
  }
}
