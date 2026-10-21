import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDeviceToken extends Document {
  id: string;
  deviceId: mongoose.Types.ObjectId;
  token: string;
  tokenHash: string;
  expiresAt?: Date | null;
  revokedAt?: Date | null;
  lastUsedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceTokenSchema = new Schema<IDeviceToken>(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
    token: { type: String, required: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    lastUsedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        ret.device_id = ret.deviceId.toString();
        ret.token_hash = ret.tokenHash;
        ret.expires_at = ret.expiresAt;
        ret.revoked_at = ret.revokedAt;
        ret.last_used_at = ret.lastUsedAt;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const DeviceToken: Model<IDeviceToken> = mongoose.model<IDeviceToken>('DeviceToken', DeviceTokenSchema);
