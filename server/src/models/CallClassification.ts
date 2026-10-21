import mongoose, { Schema, Document, Model } from 'mongoose';

export type ClassificationType = 'business' | 'personal' | 'ignored';

export interface ICallClassification extends Document {
  id: string;
  callLogId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId | null;
  agentId?: mongoose.Types.ObjectId | null;
  type: ClassificationType;
  note?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

const CallClassificationSchema = new Schema<ICallClassification>(
  {
    callLogId: { type: Schema.Types.ObjectId, ref: 'CallLog', required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    agentId: { type: Schema.Types.ObjectId, ref: 'Agent', default: null },
    type: { type: String, enum: ['business', 'personal', 'ignored'], required: true, index: true },
    note: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        ret.call_log_id = ret.callLogId.toString();
        ret.classification = ret.type;
        ret.classified_by = ret.userId ? ret.userId.toString() : ret.agentId ? ret.agentId.toString() : null;
        ret.classified_at = ret.updatedAt || ret.createdAt;
        ret.note = ret.note;
        ret.metadata = ret.metadata;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const CallClassification: Model<ICallClassification> =
  mongoose.model<ICallClassification>('CallClassification', CallClassificationSchema);
