import { describe, it, expect, vi } from "vitest"
import { usersApi } from "./users"
import { api } from "./api"

vi.mock("./api", () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}))

describe("usersApi", () => {
    it("getUsers calls correct endpoint", async () => {
        await usersApi.getUsers(2, 10, "test")
        expect(api.get).toHaveBeenCalledWith("/api/v1/admin/users?page=2&per_page=10&search=test")
    })

    it("createUser calls correct endpoint", async () => {
        const data = { name: "Test", email: "test@example.com", password: "p", password_confirmation: "p" }
        vi.mocked(api.post).mockResolvedValueOnce({ data: { data: { id: 1 } } })
        await usersApi.createUser(data)
        expect(api.post).toHaveBeenCalledWith("/api/v1/admin/users", data)
    })

    it("deleteUser calls correct endpoint", async () => {
        await usersApi.deleteUser(1)
        expect(api.delete).toHaveBeenCalledWith("/api/v1/admin/users/1")
    })

    it("resetTwoFactor calls correct endpoint", async () => {
        await usersApi.resetTwoFactor(1)
        expect(api.post).toHaveBeenCalledWith("/api/v1/admin/users/1/reset-2fa")
    })

    it("updateRole calls correct endpoint", async () => {
        await usersApi.updateRole(1, "admin")
        expect(api.put).toHaveBeenCalledWith("/api/v1/admin/users/1/role", { role: "admin" })
    })

    it("unlinkUserFromAgent calls correct endpoint", async () => {
        await usersApi.unlinkUserFromAgent(1, 2)
        expect(api.post).toHaveBeenCalledWith("/api/v1/admin/agents/1/unlink-user", { user_id: 2 })
    })
})
