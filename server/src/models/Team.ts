import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeam extends Document {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null },
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

export const Team: Model<ITeam> = mongoose.model<ITeam>('Team', TeamSchema);

export interface ITeamMember extends Document {
  id: string;
  teamId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  role: 'MEMBER' | 'MANAGER';
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    agentId: { type: Schema.Types.ObjectId, ref: 'Agent', required: true, index: true },
    role: { type: String, enum: ['MEMBER', 'MANAGER'], default: 'MEMBER' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        ret.team_id = ret.teamId.toString();
        ret.agent_id = ret.agentId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

TeamMemberSchema.index({ teamId: 1, agentId: 1 }, { unique: true });

export const TeamMember: Model<ITeamMember> = mongoose.model<ITeamMember>('TeamMember', TeamMemberSchema);
