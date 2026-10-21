import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditEvent extends Document {
  id: string;
  userId?: mongoose.Types.ObjectId | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  payload?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

const AuditEventSchema = new Schema<IAuditEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true, index: true },
    entityType: { type: String, default: null },
    entityId: { type: String, default: null },
    payload: { type: Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable audit trail
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        ret.user_id = ret.userId ? ret.userId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const AuditEvent: Model<IAuditEvent> = mongoose.model<IAuditEvent>('AuditEvent', AuditEventSchema);
