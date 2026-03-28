import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSettingsQuery, useUpdateSettingsMutation } from "./use-settings";
import { settingsApi } from "../api/settings-api";
import { toast } from "sonner";
import React from "react";

// Mock the api module
vi.mock("../api/settings-api", () => ({
    settingsApi: {
        getSettings: vi.fn(),
        updateSettings: vi.fn(),
    },
}));

// Mock sonner
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    // eslint-disable-next-line react/display-name
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}

describe("use-settings hooks", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("useSettingsQuery", () => {
        it("should fetch settings", async () => {
            const mockData = {
                heartbeat_threshold_minutes: 60,
                fcm_stale_title: "Title",
                fcm_stale_body: "Body",
                escalation_sla_hours: 2,
            };

            vi.mocked(settingsApi.getSettings).mockResolvedValueOnce({ data: mockData });

            const { result } = renderHook(() => useSettingsQuery(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(settingsApi.getSettings).toHaveBeenCalledTimes(1);
            expect(result.current.data).toEqual(mockData);
        });
    });

    describe("useUpdateSettingsMutation", () => {
        it("should call updateSettings and show success toast on success", async () => {
            vi.mocked(settingsApi.updateSettings).mockResolvedValueOnce({ message: "Success" });

            const { result } = renderHook(() => useUpdateSettingsMutation(), {
                wrapper: createWrapper(),
            });

            const payload = {
                settings: {
                    heartbeat_threshold_minutes: 120,
                }
            };

            result.current.mutate(payload);

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(settingsApi.updateSettings).toHaveBeenCalledWith(payload);
            expect(toast.success).toHaveBeenCalledWith("Success", expect.any(Object));
        });

        it("should show error toast on failure", async () => {
            const error = {
                response: {
                    data: {
                        message: "Validation Error",
                    }
                }
            };
            vi.mocked(settingsApi.updateSettings).mockRejectedValueOnce(error);

            const { result } = renderHook(() => useUpdateSettingsMutation(), {
                wrapper: createWrapper(),
            });

            const payload = {
                settings: {
                    heartbeat_threshold_minutes: 120,
                }
            };

            result.current.mutate(payload);

            await waitFor(() => expect(result.current.isError).toBe(true));

            expect(settingsApi.updateSettings).toHaveBeenCalledWith(payload);
            expect(toast.error).toHaveBeenCalledWith("Error", expect.objectContaining({
                description: "Validation Error"
            }));
        });
    });
});
