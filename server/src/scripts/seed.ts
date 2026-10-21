import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { config } from '../config/env.js';
import { User } from '../models/User.js';
import { Agent } from '../models/Agent.js';
import { Team, TeamMember } from '../models/Team.js';
import { SystemSetting } from '../models/SystemSetting.js';

async function seed() {
  console.log('[Seed] Connecting to MongoDB...');
  await connectDB();

  // 1. Seed Admin User
  let admin = await User.findOne({ email: config.adminEmail.toLowerCase() });
  if (!admin) {
    admin = await User.create({
      name: 'Super Administrator',
      email: config.adminEmail.toLowerCase(),
      password: config.adminPassword,
      roles: ['admin'],
      permissions: ['*'],
    });
    console.log(`[Seed] Created admin user: ${config.adminEmail} (password: ${config.adminPassword})`);
  } else {
    console.log(`[Seed] Admin user already exists: ${config.adminEmail}`);
  }

  // 2. Seed Default System Settings
  const defaultSettings: Record<string, any> = {
    app_sitename: 'CallTrack AI Admin',
    call_sync_interval_minutes: 15,
    missed_call_sla_minutes: 15,
    enable_missed_call_class_filter: true,
    tracked_sim_slots: [0, 1],
    filter_visibility: {
      date_range: true,
      agents: true,
      teams: true,
      call_types: true,
      outcomes: true,
      classifications: true,
      sim_slots: true,
    },
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    const existing = await SystemSetting.findOne({ key });
    if (!existing) {
      await SystemSetting.create({ key, value });
      console.log(`[Seed] Added default setting: ${key}`);
    }
  }

  // 3. Seed Sample Team & Agent if empty
  const agentCount = await Agent.countDocuments();
  if (agentCount === 0) {
    const sampleAgent = await Agent.create({
      name: 'John Doe',
      employeeCode: 'AGT-001',
      status: 'active',
      phone: '+919876543210',
      email: 'john.doe@calltrack.test',
    });

    const sampleTeam = await Team.create({
      name: 'Sales Alpha',
      description: 'Primary Sales Outbound Team',
    });

    await TeamMember.create({
      teamId: sampleTeam._id,
      agentId: sampleAgent._id,
      role: 'MANAGER',
    });

    console.log(`[Seed] Created sample agent (John Doe) and team (Sales Alpha)`);
  }

  console.log('[Seed] Database seeding completed successfully.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed] Error during seeding:', err);
  process.exit(1);
});
