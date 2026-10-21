import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  password?: string;
  roles: string[];
  permissions: string[];
  twoFactorSecret?: string | null;
  twoFactorRecoveryCodes?: string[];
  twoFactorConfirmedAt?: Date | null;
  agentId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    roles: { type: [String], default: ['admin'] },
    permissions: { type: [String], default: [] },
    twoFactorSecret: { type: String, default: null },
    twoFactorRecoveryCodes: { type: [String], default: [] },
    twoFactorConfirmedAt: { type: Date, default: null },
    agentId: { type: Schema.Types.ObjectId, ref: 'Agent', default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.twoFactorSecret;
        delete ret.twoFactorRecoveryCodes;
        return ret;
      },
    },
  }
);

UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
