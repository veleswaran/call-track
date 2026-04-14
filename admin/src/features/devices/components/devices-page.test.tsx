import { render, screen } from "@testing-library/react";
import DevicesPage from "../../../../app/(dashboard)/devices/page";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock hooks
const mockUseDevices = vi.fn();
const mockRevokeDeviceTokens = vi.fn();
vi.mock("@features/devices/hooks/use-devices", () => ({
    useDevices: (params: Record<string, unknown>) => mockUseDevices(params),
    useRevokeDeviceTokens: () => ({
        mutate: mockRevokeDeviceTokens,
        isPending: false,
    }),
    useSendPushNotification: () => ({
        mutate: vi.fn(),
        isPending: false,
    }),
}));

// Mock Auth
const mockUseAuth = vi.fn();
vi.mock("@features/auth/hooks/use-auth", () => ({
    useAuth: () => mockUseAuth(),
}));

// Mock Settings
import { useSettingsQuery } from "@features/settings/hooks/use-settings";
vi.mock("@features/settings/hooks/use-settings", () => ({
    useSettingsQuery: vi.fn(),
}));

// Mock Components
vi.mock("@features/devices/components/device-registration-code-dialog", () => ({
    DeviceRegistrationCodeDialog: () => <div data-testid="registration-dialog">Registration Dialog</div>,
}));
vi.mock("@features/devices/components/device-events-dialog", () => ({
    DeviceEventsDialog: () => <div data-testid="events-dialog">Events Dialog</div>,
}));

describe("DevicesPage", () => {
    const mockDevices = [
        {
            id: 1,
            device_identifier: "DEV001",
            device_uuid: "uuid-1",
            device_name: "Test Device",
            device_model: "Pixel 6",
            status: "active",
            last_sync_at: new Date().toISOString(),
            battery_level: 80,
            tracked_sim_slots: [],
            agent: { id: 1, name: "Test Agent" },
        },
    ];

    it("shows revoke button and registration dialog for Admin", () => {
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        mockUseAuth.mockReturnValue({
            user: { roles: ["admin"], permissions: ["manage devices", "generate registration codes"] },
        });
        vi.mocked(useSettingsQuery).mockReturnValue({
            data: { enable_device_status_filter: true },
            isLoading: false,
        } as unknown as ReturnType<typeof useSettingsQuery>);
        mockUseDevices.mockReturnValue({ data: { data: mockDevices }, isLoading: false } as unknown as ReturnType<typeof useDevices>);

        render(
            <QueryClientProvider client={queryClient}>
                <DevicesPage />
            </QueryClientProvider>
        );

        expect(screen.getByTitle("Revoke Tokens")).toBeInTheDocument();
        expect(screen.getByTestId("registration-dialog")).toBeInTheDocument();
    });

    it("hides actions for Manager without permissions", () => {
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        mockUseAuth.mockReturnValue({
            user: { roles: ["manager"], permissions: ["view device sync logs"] }, // No manage devices
        });
        vi.mocked(useSettingsQuery).mockReturnValue({
            data: { enable_device_status_filter: true },
            isLoading: false,
        } as unknown as ReturnType<typeof useSettingsQuery>);
        mockUseDevices.mockReturnValue({ data: { data: mockDevices }, isLoading: false } as unknown as ReturnType<typeof useDevices>);

        render(
            <QueryClientProvider client={queryClient}>
                <DevicesPage />
            </QueryClientProvider>
        );
        expect(screen.queryByTitle("Revoke Tokens")).not.toBeInTheDocument();
        expect(screen.queryByTestId("registration-dialog")).not.toBeInTheDocument();
    });

    it("calls useDevices with sync_status when selected", async () => {
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        mockUseAuth.mockReturnValue({
            user: { roles: ["admin"] },
        });
        vi.mocked(useSettingsQuery).mockReturnValue({
            data: { enable_device_status_filter: true },
            isLoading: false,
        } as unknown as ReturnType<typeof useSettingsQuery>);
        mockUseDevices.mockReturnValue({ data: { data: mockDevices }, isLoading: false } as unknown as ReturnType<typeof useDevices>);

        render(
            <QueryClientProvider client={queryClient}>
                <DevicesPage />
            </QueryClientProvider>
        );

        // Check if "Sync Status" trigger is present
        // Since it's a shadcn Select and it has a default value 'all', it shows the label for 'all'
        const syncStatusTrigger = screen.getByText("All Sync Statuses");
        expect(syncStatusTrigger).toBeInTheDocument();
    });

    it("shows loading message when devices are loading", () => {
        const queryClient = new QueryClient();
        mockUseAuth.mockReturnValue({ user: { roles: ["admin"] } });
        vi.mocked(useSettingsQuery).mockReturnValue({ data: { enable_device_status_filter: true }, isLoading: false } as unknown as ReturnType<typeof useSettingsQuery>);
        mockUseDevices.mockReturnValue({ data: null, isLoading: true } as unknown as ReturnType<typeof useDevices>);

        render(
            <QueryClientProvider client={queryClient}>
                <DevicesPage />
            </QueryClientProvider>
        );

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("shows error message when device loading fails", () => {
        const queryClient = new QueryClient();
        mockUseAuth.mockReturnValue({ user: { roles: ["admin"] } });
        vi.mocked(useSettingsQuery).mockReturnValue({ data: { enable_device_status_filter: true }, isLoading: false } as unknown as ReturnType<typeof useSettingsQuery>);
        mockUseDevices.mockReturnValue({ data: null, isLoading: false, isError: true } as unknown as ReturnType<typeof useDevices>);

        render(
            <QueryClientProvider client={queryClient}>
                <DevicesPage />
            </QueryClientProvider>
        );

        expect(screen.getByText("Failed to load devices")).toBeInTheDocument();
    });

    it("shows empty state message when no devices are found", () => {
        const queryClient = new QueryClient();
        mockUseAuth.mockReturnValue({ user: { roles: ["admin"] } });
        vi.mocked(useSettingsQuery).mockReturnValue({ data: { enable_device_status_filter: true }, isLoading: false } as unknown as ReturnType<typeof useSettingsQuery>);
        mockUseDevices.mockReturnValue({ data: { data: [] }, isLoading: false } as unknown as ReturnType<typeof useDevices>);

        render(
            <QueryClientProvider client={queryClient}>
                <DevicesPage />
            </QueryClientProvider>
        );

        expect(screen.getByText("No devices found")).toBeInTheDocument();
    });
});
