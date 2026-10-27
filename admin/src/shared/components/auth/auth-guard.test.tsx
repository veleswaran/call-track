import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthGuard } from "./auth-guard";
import { authService } from "@shared/api/auth-service";

const mockPush = vi.fn();
const mockRouter = { push: mockPush };
vi.mock("next/navigation", () => ({
    useRouter: () => mockRouter,
    usePathname: () => "/dashboard",
}));

vi.mock("@shared/api/auth-service", () => ({
    authService: {
        getCurrentUser: vi.fn(),
    },
}));

describe("AuthGuard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders children when user is authenticated", async () => {
        vi.mocked(authService.getCurrentUser).mockResolvedValueOnce({
            id: 1,
            name: "Admin",
            email: "admin@example.com",
            roles: ["admin"],
        });

        render(
            <AuthGuard>
                <div>Protected Content</div>
            </AuthGuard>
        );

        await waitFor(() => {
            expect(screen.getByText("Protected Content")).toBeInTheDocument();
        });
        expect(mockPush).not.toHaveBeenCalled();
    });

    it("redirects to login when unauthenticated", async () => {
        vi.mocked(authService.getCurrentUser).mockRejectedValueOnce(new Error("Unauthorized"));

        render(
            <AuthGuard>
                <div>Protected Content</div>
            </AuthGuard>
        );

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/login");
        });
        expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
});
