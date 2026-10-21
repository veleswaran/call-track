import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAgent extends Document {
  id: string;
  name: string;
  employeeCode: string | null;
  status: 'active' | 'inactive';
  userId: mongoose.Types.ObjectId | null;
  phone?: string | null;
  email?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const AgentSchema = new Schema<IAgent>(
  {
    name: { type: String, required: true, trim: true },
    employeeCode: { type: String, default: null, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    phone: { type: String, default: null, trim: true },
    email: { type: String, default: null, lowercase: true, trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        ret.employee_code = ret.employeeCode;
        ret.user_id = ret.userId ? ret.userId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Agent: Model<IAgent> = mongoose.model<IAgent>('Agent', AgentSchema);
