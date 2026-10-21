import mongoose, { Schema, Document, Model } from 'mongoose';

export type CallDirection = 'INCOMING' | 'OUTGOING' | 'MISSED' | 'REJECTED' | 'BLOCKED' | 'UNKNOWN';
export type CallOutcome = 'Connected' | 'Missed' | 'No Answer';

export interface ICallLog extends Document {
  id: string;
  deviceId: mongoose.Types.ObjectId;
  agentId?: mongoose.Types.ObjectId | null;
  callHash: string;
  phoneNumber: string;
  phoneNumberHash?: string | null;
  phoneContactName?: string | null;
  contactName?: string | null;
  simSlot?: number | null;
  direction: CallDirection;
  duration: number;
  timestamp: Date;
  rawData?: Record<string, any> | null;
  syncedAt: Date;
  createdAt: Date;
  callOutcome: CallOutcome;
}

const CallLogSchema = new Schema<ICallLog>(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
    agentId: { type: Schema.Types.ObjectId, ref: 'Agent', default: null, index: true },
    callHash: { type: String, required: true, unique: true, index: true },
    phoneNumber: { type: String, required: true, index: true },
    phoneNumberHash: { type: String, default: null, index: true },
    phoneContactName: { type: String, default: null },
    contactName: { type: String, default: null },
    simSlot: { type: Number, default: null, index: true },
    direction: {
      type: String,
      enum: ['INCOMING', 'OUTGOING', 'MISSED', 'REJECTED', 'BLOCKED', 'UNKNOWN'],
      required: true,
      index: true,
    },
    duration: { type: Number, required: true, default: 0 },
    timestamp: { type: Date, required: true, index: true },
    rawData: { type: Schema.Types.Mixed, default: null },
    syncedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Call logs are strictly insert-only and immutable!
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        ret.device_id = ret.deviceId.toString();
        ret.agent_id = ret.agentId ? ret.agentId.toString() : null;
        ret.call_hash = ret.callHash;
        ret.phone_number = ret.phoneNumber;
        ret.phone_contact_name = ret.phoneContactName;
        ret.contact_name = ret.contactName;
        ret.call_type = (ret.direction || 'unknown').toLowerCase();
        ret.duration = ret.duration;
        ret.sim_slot = ret.simSlot;
        ret.timestamp = ret.timestamp;
        ret.created_at = ret.createdAt;
        ret.call_outcome = ret.callOutcome;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

CallLogSchema.virtual('callOutcome').get(function (this: ICallLog) {
  const dir = (this.direction || '').toUpperCase();
  if (['MISSED', 'REJECTED', 'BLOCKED'].includes(dir) || (dir === 'INCOMING' && this.duration <= 0)) {
    return 'Missed';
  }
  if (dir === 'OUTGOING' && this.duration === 0) {
    return 'No Answer';
  }
  return 'Connected';
});

// Composite index for fast filtering and reporting
CallLogSchema.index({ timestamp: -1, deviceId: 1, agentId: 1 });
CallLogSchema.index({ timestamp: -1, direction: 1 });

export const CallLog: Model<ICallLog> = mongoose.model<ICallLog>('CallLog', CallLogSchema);
