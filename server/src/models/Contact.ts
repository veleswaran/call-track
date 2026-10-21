import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IContact extends Document {
  id: string;
  name: string;
  phoneNumber: string;
  phoneHash: string;
  notes?: string | null;
  company?: string | null;
  isInternal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    name: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    phoneHash: { type: String, required: true, unique: true, index: true },
    notes: { type: String, default: null },
    company: { type: String, default: null },
    isInternal: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        ret.phone_number = ret.phoneNumber;
        ret.phone_hash = ret.phoneHash;
        ret.is_internal = ret.isInternal;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Contact: Model<IContact> = mongoose.model<IContact>('Contact', ContactSchema);
