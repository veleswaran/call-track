import mongoose, { Schema, Document, Model } from 'mongoose';

export type EscalationStatus = 'pending' | 'unattended' | 'resolved';

export interface ICallEscalation extends Document {
  id: string;
  callLogId: mongoose.Types.ObjectId;
  status: EscalationStatus;
  responseDueAt: Date;
  resolvedAt?: Date | null;
  resolvedByCallId?: mongoose.Types.ObjectId | null;
  notifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const CallEscalationSchema = new Schema<ICallEscalation>(
  {
    callLogId: { type: Schema.Types.ObjectId, ref: 'CallLog', required: true, unique: true, index: true },
    status: { type: String, enum: ['pending', 'unattended', 'resolved'], default: 'pending', index: true },
    responseDueAt: { type: Date, required: true },
    resolvedAt: { type: Date, default: null },
    resolvedByCallId: { type: Schema.Types.ObjectId, ref: 'CallLog', default: null },
    notifiedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        ret.call_log_id = ret.callLogId.toString();
        ret.status = ret.status;
        ret.response_due_at = ret.responseDueAt;
        ret.resolved_at = ret.resolvedAt;
        ret.resolved_by_call_id = ret.resolvedByCallId ? ret.resolvedByCallId.toString() : null;
        ret.notified_at = ret.notifiedAt;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const CallEscalation: Model<ICallEscalation> =
  mongoose.model<ICallEscalation>('CallEscalation', CallEscalationSchema);
