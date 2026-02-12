import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authService } from "./auth-service";
import { api } from "./api";

// Mock the api module
vi.mock("./api", () => ({
    api: {
        post: vi.fn(),
        get: vi.fn(),
    },
}));

describe("authService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe("login", () => {
        it("should call api.post with login credentials", async () => {
            const credentials = { email: "admin@example.com", password: "password" };
            vi.mocked(api.post).mockResolvedValueOnce(undefined);

            await authService.login(credentials);

            expect(api.post).toHaveBeenCalledWith("/login", credentials);
        });

        it("should throw error on failed login", async () => {
            const credentials = { email: "admin@example.com", password: "wrong" };
            vi.mocked(api.post).mockRejectedValueOnce(new Error("Invalid credentials"));

            await expect(authService.login(credentials)).rejects.toThrow(
                "Invalid credentials"
            );
        });
    });

    describe("logout", () => {
        it("should call api.post to logout endpoint", async () => {
            vi.mocked(api.post).mockResolvedValueOnce(undefined);

            await authService.logout();

            expect(api.post).toHaveBeenCalledWith("/logout");
        });

        it("should throw error on failed logout", async () => {
            vi.mocked(api.post).mockRejectedValueOnce(new Error("Session expired"));

            await expect(authService.logout()).rejects.toThrow("Session expired");
        });
    });

    describe("getCurrentUser", () => {
        it("should return user when authenticated", async () => {
            const mockUser = {
                id: 1,
                name: "Admin",
                email: "admin@example.com",
                email_verified_at: "2024-01-01T00:00:00Z",
                created_at: "2024-01-01T00:00:00Z",
                updated_at: "2024-01-01T00:00:00Z",
            };
            vi.mocked(api.get).mockResolvedValueOnce({ data: mockUser });

            const result = await authService.getCurrentUser();

            expect(api.get).toHaveBeenCalledWith("/api/user");
            expect(result).toEqual(mockUser);
        });

        it("should return null when not authenticated", async () => {
            vi.mocked(api.get).mockRejectedValueOnce(new Error("Unauthenticated"));

            const result = await authService.getCurrentUser();

            expect(result).toBeNull();
        });
    });

    describe("twoFactor", () => {
        it("should challenge 2fa", async () => {
            const mockUser = { id: 1, name: "User" };
            vi.mocked(api.post).mockResolvedValueOnce({ user: mockUser });
            const result = await authService.twoFactorChallenge("123456");
            expect(api.post).toHaveBeenCalledWith("/api/v1/auth/two-factor/challenge", { code: "123456" });
            expect(result).toEqual(mockUser);
        });

        it("should enable 2fa", async () => {
            const mockRes = { secret: "secret", qr_code_url: "url" };
            vi.mocked(api.post).mockResolvedValueOnce(mockRes);
            const result = await authService.enableTwoFactor();
            expect(api.post).toHaveBeenCalledWith("/api/v1/auth/two-factor/enable");
            expect(result).toEqual(mockRes);
        });

        it("should confirm 2fa", async () => {
            const mockRes = { recovery_codes: ["code1"] };
            vi.mocked(api.post).mockResolvedValueOnce(mockRes);
            const result = await authService.confirmTwoFactor("secret", "123456");
            expect(api.post).toHaveBeenCalledWith("/api/v1/auth/two-factor/confirm", { secret: "secret", code: "123456" });
            expect(result).toEqual(mockRes);
        });

        it("should disable 2fa", async () => {
            vi.mocked(api.post).mockResolvedValueOnce(undefined);
            await authService.disableTwoFactor("password");
            expect(api.post).toHaveBeenCalledWith("/api/v1/auth/two-factor/disable", { password: "password" });
        });

        it("should get recovery codes", async () => {
            const mockRes = { recovery_codes: ["code1"] };
            vi.mocked(api.post).mockResolvedValueOnce(mockRes);
            const result = await authService.getRecoveryCodes("password");
            expect(api.post).toHaveBeenCalledWith("/api/v1/auth/two-factor/recovery-codes", { password: "password" });
            expect(result).toEqual(mockRes);
        });
    });
});
