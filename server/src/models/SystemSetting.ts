import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISystemSetting extends Document {
  id: string;
  key: string;
  value: any;
  createdAt: Date;
  updatedAt: Date;
}

const SystemSettingSchema = new Schema<ISystemSetting>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const SystemSetting: Model<ISystemSetting> =
  mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
