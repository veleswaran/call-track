import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsPage } from "./settings-page";
import { useSettingsQuery, useUpdateSettingsMutation } from "../hooks/use-settings";
import type { UseQueryResult } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { SettingsData } from "../types";
// Mock the hooks
vi.mock("../hooks/use-settings", () => ({
    useSettingsQuery: vi.fn(),
    useUpdateSettingsMutation: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

describe("SettingsPage", () => {
    const mockUpdateMutate = vi.fn();

    const defaultSettings: SettingsData = {
        heartbeat_threshold_minutes: 60,
        fcm_stale_title: "Warning",
        fcm_stale_body: "Wake up",
        escalation_sla_hours: 2,
        enable_device_search: false,
        enable_user_search: false,
        enable_agent_search: false,
        enable_contact_search: false,
        enable_report_sim_filter: false,
        enable_call_log_sim_filter: false,
        enable_agent_status_filter: false,
        enable_device_status_filter: false,
        enable_call_log_internal_filter: false,
        enable_report_internal_filter: false,
        enable_missed_call_internal_filter: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useUpdateSettingsMutation).mockReturnValue({
            mutate: mockUpdateMutate,
            isPending: false,
        } as unknown as ReturnType<typeof useUpdateSettingsMutation>);
    });

    it("should display loading spinner when loading", () => {
        vi.mocked(useSettingsQuery).mockReturnValue({
            isLoading: true,
            data: undefined,
        } as unknown as UseQueryResult<SettingsData>);

        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const { container } = render(
            <QueryClientProvider client={queryClient}>
                <SettingsPage />
            </QueryClientProvider>
        );
        expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("should render form with fetched settings", async () => {
        vi.mocked(useSettingsQuery).mockReturnValue({
            isLoading: false,
            data: {
                ...defaultSettings,
                heartbeat_threshold_minutes: 120,
                fcm_stale_title: "Test Title",
                fcm_stale_body: "Test Body",
                escalation_sla_hours: 4,
            },
        } as unknown as UseQueryResult<SettingsData>);

        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        render(
            <QueryClientProvider client={queryClient}>
                <SettingsPage />
            </QueryClientProvider>
        );

        expect(screen.getByLabelText(/Stale Heartbeat Threshold/i)).toHaveValue(120);
        expect(screen.getByLabelText(/Push Notification Title/i)).toHaveValue("Test Title");
        expect(screen.getByLabelText(/Push Notification Message/i)).toHaveValue("Test Body");
        expect(screen.getByLabelText(/Escalation SLA Deadline/i)).toHaveValue(4);
    });

    it("should validate and submit form correctly", async () => {
        const user = userEvent.setup();

        vi.mocked(useSettingsQuery).mockReturnValue({
            isLoading: false,
            data: {
                ...defaultSettings,
                fcm_stale_title: "",
                fcm_stale_body: "",
            },
        } as unknown as UseQueryResult<SettingsData>);

        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        render(
            <QueryClientProvider client={queryClient}>
                <SettingsPage />
            </QueryClientProvider>
        );

        const titleInput = screen.getByLabelText(/Push Notification Title/i);
        const bodyInput = screen.getByLabelText(/Push Notification Message/i);

        await user.type(titleInput, "New Warning");
        await user.type(bodyInput, "Wake up device");

        const submitBtn = screen.getByRole("button", { name: /Save Settings/i });
        await user.click(submitBtn);

        await waitFor(() => {
            expect(mockUpdateMutate).toHaveBeenCalledWith({
                settings: {
                    heartbeat_threshold_minutes: 60,
                    fcm_stale_title: "New Warning",
                    fcm_stale_body: "Wake up device",
                    escalation_sla_hours: 2,
                    enable_call_log_sim_filter: false,
                    enable_agent_status_filter: false,
                    enable_device_status_filter: false,
                    enable_call_log_internal_filter: false,
                    enable_report_internal_filter: false,
                    enable_missed_call_internal_filter: false,
                }
            });
        });
    });

    it("should show validation errors when values are incorrect", async () => {
        const user = userEvent.setup();

        vi.mocked(useSettingsQuery).mockReturnValue({
            isLoading: false,
            data: {
                ...defaultSettings,
                fcm_stale_title: "Valid",
                fcm_stale_body: "Valid",
            },
        } as unknown as UseQueryResult<SettingsData>);

        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        render(
            <QueryClientProvider client={queryClient}>
                <SettingsPage />
            </QueryClientProvider>
        );

        const thresholdInput = screen.getByLabelText(/Stale Heartbeat Threshold/i);
        await user.clear(thresholdInput);

        const submitBtn = screen.getByRole("button", { name: /Save Settings/i });
        await user.click(submitBtn);

        await waitFor(() => {
            expect(mockUpdateMutate).not.toHaveBeenCalled();
        });
    });
});
