import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDeviceEvent extends Document {
  id: string;
  deviceId: mongoose.Types.ObjectId;
  eventType: string;
  payload?: Record<string, any> | null;
  occurredAt: Date;
  createdAt: Date;
}

const DeviceEventSchema = new Schema<IDeviceEvent>(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
    eventType: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, default: null },
    occurredAt: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        ret.device_id = ret.deviceId.toString();
        ret.event_type = ret.eventType;
        ret.occurred_at = ret.occurredAt;
        ret.created_at = ret.createdAt;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const DeviceEvent: Model<IDeviceEvent> = mongoose.model<IDeviceEvent>('DeviceEvent', DeviceEventSchema);

export interface IDeviceSyncLog extends Document {
  id: string;
  deviceId: mongoose.Types.ObjectId;
  syncedCount: number;
  batteryLevel?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

const DeviceSyncLogSchema = new Schema<IDeviceSyncLog>(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
    syncedCount: { type: Number, required: true },
    batteryLevel: { type: Number, default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        ret.device_id = ret.deviceId.toString();
        ret.synced_count = ret.syncedCount;
        ret.battery_level = ret.batteryLevel;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const DeviceSyncLog: Model<IDeviceSyncLog> = mongoose.model<IDeviceSyncLog>('DeviceSyncLog', DeviceSyncLogSchema);
