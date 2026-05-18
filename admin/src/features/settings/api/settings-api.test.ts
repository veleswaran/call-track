import { describe, it, expect, vi, beforeEach } from 'vitest';
import { settingsApi } from './settings-api';
import { api } from '@shared/api/api';

vi.mock('@shared/api/api', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

describe('settingsApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getSettings', () => {
        it('should fetch settings data', async () => {
            const mockResponse = {
                data: {
                    heartbeat_threshold_minutes: 60,
                    device_archive_days: 15,
                    fcm_stale_title: 'Test Title',
                    fcm_stale_body: 'Test Body',
                }
            };

            vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

            const result = await settingsApi.getSettings();

            expect(api.get).toHaveBeenCalledWith('/api/v1/admin/settings');
            expect(result).toEqual(mockResponse);
        });
    });

    describe('updateSettings', () => {
        it('should update settings data', async () => {
            const payload = {
                settings: {
                    heartbeat_threshold_minutes: 120,
                    device_archive_days: 30,
                    fcm_stale_title: 'New Title',
                    fcm_stale_body: 'New Body',
                }
            };
            const mockResponse = { message: 'Settings updated successfully' };

            vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

            const result = await settingsApi.updateSettings(payload);

            expect(api.post).toHaveBeenCalledWith('/api/v1/admin/settings', payload);
            expect(result).toEqual(mockResponse);
        });
    });
});
