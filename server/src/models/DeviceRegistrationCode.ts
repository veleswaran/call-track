import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDeviceRegistrationCode extends Document {
  id: string;
  code: string;
  agentId?: mongoose.Types.ObjectId | null;
  deviceId?: mongoose.Types.ObjectId | null;
  expiresAt?: Date | null;
  usedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceRegistrationCodeSchema = new Schema<IDeviceRegistrationCode>(
  {
    code: { type: String, required: true, unique: true, index: true },
    agentId: { type: Schema.Types.ObjectId, ref: 'Agent', default: null },
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', default: null },
    expiresAt: { type: Date, default: null },
    usedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        ret.agent_id = ret.agentId ? ret.agentId.toString() : null;
        ret.device_id = ret.deviceId ? ret.deviceId.toString() : null;
        ret.expires_at = ret.expiresAt;
        ret.used_at = ret.usedAt;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const DeviceRegistrationCode: Model<IDeviceRegistrationCode> =
  mongoose.model<IDeviceRegistrationCode>('DeviceRegistrationCode', DeviceRegistrationCodeSchema);
