import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DevicePushNotificationDialog } from "./device-push-notification-dialog";
import { useSendPushNotification } from "../hooks/use-devices";
import { Device } from "@shared/types";
import { toast } from "sonner";

// Mock the hook
vi.mock("../hooks/use-devices", () => ({
    useSendPushNotification: vi.fn(),
}));

// Mock sonner
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const mockDevice = {
    id: 1,
    device_name: "Test Device",
    has_fcm_token: true,
} as Device;

describe("DevicePushNotificationDialog", () => {
    let mockMutate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockMutate = vi.fn();
        vi.mocked(useSendPushNotification).mockReturnValue({
            mutate: mockMutate,
            isPending: false,
        } as unknown as ReturnType<typeof useSendPushNotification>);
    });

    it("should be disabled if device has no fcm token", () => {
        render(<DevicePushNotificationDialog device={{ ...mockDevice, has_fcm_token: false }} />);

        const button = screen.getByRole("button", { name: /Send Push Notification/i });
        expect(button).toBeDisabled();
    });

    it("should render dialog content when clicked", async () => {
        const user = userEvent.setup();
        render(<DevicePushNotificationDialog device={mockDevice} />);

        const button = screen.getByRole("button", { name: /Send Push Notification/i });
        expect(button).not.toBeDisabled();

        await user.click(button);

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Test Device")).toBeInTheDocument();
    });

    it("should successfully submit mutation and close dialog", async () => {
        const user = userEvent.setup();

        // Setup mutate callback to immediately invoke onSuccess
        mockMutate.mockImplementation((payload, { onSuccess }) => {
            onSuccess();
        });

        render(<DevicePushNotificationDialog device={mockDevice} />);

        await user.click(screen.getByRole("button", { name: /Send Push Notification/i }));

        // Change title and body
        const titleInput = screen.getByLabelText(/Title \(Optional\)/i);
        const bodyInput = screen.getByLabelText(/Message Body \(Optional\)/i);

        await user.type(titleInput, "Alert");
        await user.type(bodyInput, "Check phone");

        // Submit
        await user.click(screen.getByRole("button", { name: "Send Push" }));

        await waitFor(() => {
            expect(mockMutate).toHaveBeenCalledWith(
                { title: "Alert", body: "Check phone" },
                expect.any(Object)
            );
            expect(toast.success).toHaveBeenCalledWith("Push Notification Sent", expect.any(Object));
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });
    });
});
