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
            status: { id: 1, name: "Active", color: "#22c55e" },
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
        mockUseDevices.mockReturnValue({ data: { data: mockDevices }, isLoading: false });

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
        mockUseDevices.mockReturnValue({ data: { data: mockDevices }, isLoading: false });

        render(
            <QueryClientProvider client={queryClient}>
                <DevicesPage />
            </QueryClientProvider>
        );

        expect(screen.queryByTitle("Revoke Tokens")).not.toBeInTheDocument();
        expect(screen.queryByTestId("registration-dialog")).not.toBeInTheDocument();
    });
});
