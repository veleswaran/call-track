import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDevice extends Document {
  id: string;
  deviceIdentifier: string;
  deviceUuid: string;
  deviceName?: string | null;
  deviceModel?: string | null;
  osVersion?: string | null;
  appVersion?: string | null;
  status: string;
  agentId?: mongoose.Types.ObjectId | null;
  batteryLevel?: number | null;
  trackedSimSlots?: number[] | null;
  lastSyncAt?: Date | null;
  lastHeartbeatAt?: Date | null;
  isArchived: boolean;
  fcmToken?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>(
  {
    deviceIdentifier: { type: String, required: true, unique: true, index: true },
    deviceUuid: { type: String, required: true, unique: true, index: true },
    deviceName: { type: String, default: null },
    deviceModel: { type: String, default: null },
    osVersion: { type: String, default: null },
    appVersion: { type: String, default: null },
    status: { type: String, default: 'active' },
    agentId: { type: Schema.Types.ObjectId, ref: 'Agent', default: null, index: true },
    batteryLevel: { type: Number, default: null },
    trackedSimSlots: { type: [Number], default: null },
    lastSyncAt: { type: Date, default: null },
    lastHeartbeatAt: { type: Date, default: null },
    isArchived: { type: Boolean, default: false },
    fcmToken: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        ret.device_identifier = ret.deviceIdentifier;
        ret.device_uuid = ret.deviceUuid;
        ret.device_name = ret.deviceName;
        ret.device_model = ret.deviceModel;
        ret.os_version = ret.osVersion;
        ret.app_version = ret.appVersion;
        ret.agent_id = ret.agentId ? ret.agentId.toString() : null;
        ret.battery_level = ret.batteryLevel;
        ret.tracked_sim_slots = ret.trackedSimSlots;
        ret.last_sync_at = ret.lastSyncAt;
        ret.last_heartbeat_at = ret.lastHeartbeatAt;
        ret.is_archived = ret.isArchived;
        ret.has_fcm_token = !!ret.fcmToken;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Device: Model<IDevice> = mongoose.model<IDevice>('Device', DeviceSchema);
