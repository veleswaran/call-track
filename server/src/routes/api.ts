import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import { deviceAuthMiddleware } from '../middleware/deviceAuth.js';
import * as authController from '../controllers/authController.js';
import * as deviceController from '../controllers/deviceController.js';
import * as callLogController from '../controllers/callLogController.js';
import * as escalationController from '../controllers/escalationController.js';
import * as dashboardController from '../controllers/dashboardController.js';
import * as reportController from '../controllers/reportController.js';
import * as agentController from '../controllers/agentController.js';
import * as teamController from '../controllers/teamController.js';
import * as contactController from '../controllers/contactController.js';
import * as userController from '../controllers/userController.js';
import * as settingsController from '../controllers/settingsController.js';

// Use memoryStorage in serverless environments (Vercel has a read-only filesystem except /tmp)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});
const router = Router();

// ==========================================
// 1. PUBLIC ROUTES & SANCTUM COMPATIBILITY
// ==========================================
router.get('/sanctum/csrf-cookie', authController.csrfCookie);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/api/user', authMiddleware, authController.getCurrentUser);
router.get('/user', authMiddleware, authController.getCurrentUser);

// ==========================================
// 2. API V1 ROUTES
// ==========================================
const v1 = Router();

// Public Branding & Auth
v1.get('/branding', settingsController.getBranding);
v1.post('/auth/login', authController.login);
v1.post('/auth/two-factor/challenge', authController.twoFactorChallenge);

// Open Device Registration
v1.post('/devices/register', deviceController.registerDevice);

// Device Authenticated Ingestion Routes (X-Device-Token)
v1.post('/call-logs/sync', deviceAuthMiddleware, callLogController.syncCallLogs);
v1.post('/call-logs/:callHash/classify', deviceAuthMiddleware, callLogController.deviceClassifyCall);
v1.post('/device/events', deviceAuthMiddleware, deviceController.storeDeviceEvent);
v1.post('/device/fcm-token', deviceAuthMiddleware, deviceController.updateFcmToken);

// ==========================================
// 3. ADMIN AUTHENTICATED ROUTES
// ==========================================
const admin = Router();
admin.use(authMiddleware);

// Dashboard
admin.get('/dashboard', dashboardController.getDashboardMetrics);
admin.get('/dashboard/charts', dashboardController.getDashboardCharts);

// Reports
admin.get('/reports/metrics', reportController.getReportMetrics);
admin.get('/reports/charts', reportController.getReportCharts);
admin.get('/reports/performance', reportController.getReportPerformance);
admin.get('/reports/day-wise', reportController.getReportDayWise);

// Device Registration Codes
admin.post('/devices/codes', deviceController.generateDeviceCode);
admin.get('/devices/codes', deviceController.listDeviceCodes);

// Devices
admin.get('/devices', deviceController.listAdminDevices);
admin.get('/devices/:device/events', deviceController.listDeviceEvents);
admin.post('/devices/:device/assign-agent', deviceController.assignAgentToDevice);
admin.post('/devices/:device/unassign-agent', deviceController.unassignAgentFromDevice);
admin.post('/devices/:device/revoke-tokens', deviceController.revokeDeviceTokens);
admin.post('/devices/:device/push', deviceController.sendDevicePush);

// Call Logs
admin.get('/call-logs/export', callLogController.exportCallLogs);
admin.get('/call-logs', callLogController.listAdminCallLogs);
admin.post('/calls/:id/classify', callLogController.adminClassifyCall);

// Escalations & Missed Calls
admin.get('/call-logs/escalations/export', escalationController.exportEscalations);
admin.get('/call-logs/escalations', escalationController.getEscalations);

// Contacts
admin.get('/contacts', contactController.listContacts);
admin.post('/contacts', contactController.createContact);
admin.put('/contacts/:id', contactController.updateContact);
admin.delete('/contacts/:id', contactController.deleteContact);
admin.post('/contacts/import', contactController.importContacts);

// Agents
admin.get('/agents', agentController.listAgents);
admin.post('/agents', agentController.createAgent);
admin.get('/agents/:id', agentController.showAgent);
admin.put('/agents/:id', agentController.updateAgent);
admin.delete('/agents/:id', agentController.deleteAgent);
admin.post('/agents/:agent/link-user', agentController.linkUserToAgent);
admin.post('/agents/:agent/unlink-user', agentController.unlinkUserFromAgent);

// Teams
admin.get('/teams', teamController.listTeams);
admin.post('/teams', teamController.createTeam);
admin.get('/teams/:team', teamController.showTeam);
admin.patch('/teams/:team', teamController.updateTeam);
admin.delete('/teams/:team', teamController.deleteTeam);
admin.post('/teams/:team/members', teamController.addTeamMember);
admin.delete('/teams/:team/members/:agent', teamController.removeTeamMember);
admin.patch('/teams/:team/members/:agent', teamController.updateTeamMemberRole);

// Users Management
admin.get('/users', userController.listUsers);
admin.post('/users', userController.createUser);
admin.get('/users/:id', userController.showUser);
admin.put('/users/:id', userController.updateUser);
admin.delete('/users/:id', userController.deleteUser);
admin.put('/users/:id/role', userController.updateUserRole);
admin.post('/users/:id/reset-2fa', userController.resetTwoFactor);
admin.put('/users/:id/reset-password', userController.resetPassword);

// System Settings
admin.get('/settings', settingsController.listSettings);
admin.post('/settings', settingsController.updateSettings);
admin.post('/settings/logo', upload.single('logo'), settingsController.uploadLogo);

// Mount Admin subrouter
v1.use('/admin', admin);

// Authenticated User Session & 2FA Management
v1.post('/auth/logout', authMiddleware, authController.logout);
v1.post('/profile/password', authMiddleware, authController.updatePassword);
v1.post('/auth/two-factor/enable', authMiddleware, authController.enableTwoFactor);
v1.post('/auth/two-factor/confirm', authMiddleware, authController.confirmTwoFactor);
v1.post('/auth/two-factor/disable', authMiddleware, authController.disableTwoFactor);
v1.post('/auth/two-factor/recovery-codes', authMiddleware, authController.getRecoveryCodes);

// Mount v1 router
router.use('/api/v1', v1);
router.use('/v1', v1); // Also support direct /v1

export default router;
