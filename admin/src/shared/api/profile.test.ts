import { describe, it, expect, vi } from "vitest"
import { profileApi } from "./profile"
import { api } from "./api"

vi.mock("./api", () => ({
    api: {
        post: vi.fn(),
    },
}))

describe("profileApi", () => {
    it("should call updatePassword api", async () => {
        const mockData = {
            current_password: "old",
            password: "new",
            password_confirmation: "new",
        }

        await profileApi.updatePassword(mockData)

        expect(api.post).toHaveBeenCalledWith("/api/v1/profile/password", mockData)
    })
})
