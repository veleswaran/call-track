import { describe, it, expect, vi } from "vitest";
import { teamsApi } from "./teams-api";
import { api } from "@shared/api/api";

vi.mock("@shared/api/api", () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

describe("teamsApi", () => {
    it("getTeams calls correct endpoint with pagination", async () => {
        await teamsApi.getTeams({ page: 2, per_page: 20 });
        expect(api.get).toHaveBeenCalledWith("/api/v1/admin/teams?page=2&per_page=20");
    });

    it("getTeam calls correct endpoint", async () => {
        await teamsApi.getTeam(1);
        expect(api.get).toHaveBeenCalledWith("/api/v1/admin/teams/1");
    });

    it("createTeam calls correct endpoint", async () => {
        const data = { name: "New Team" };
        await teamsApi.createTeam(data);
        expect(api.post).toHaveBeenCalledWith("/api/v1/admin/teams", data);
    });

    it("addMember calls correct endpoint", async () => {
        const data = { agent_id: 1, role: "MANAGER" as const };
        await teamsApi.addMember(1, data);
        expect(api.post).toHaveBeenCalledWith("/api/v1/admin/teams/1/members", data);
    });

    it("removeMember calls correct endpoint", async () => {
        await teamsApi.removeMember(1, 2);
        expect(api.delete).toHaveBeenCalledWith("/api/v1/admin/teams/1/members/2");
    });

    it("updateMemberRole calls correct endpoint", async () => {
        await teamsApi.updateMemberRole(1, 2, "MEMBER");
        expect(api.patch).toHaveBeenCalledWith("/api/v1/admin/teams/1/members/2", { role: "MEMBER" });
    });

    it("updateTeam calls correct endpoint", async () => {
        const data = { name: "Updated Team" };
        await teamsApi.updateTeam(1, data);
        expect(api.patch).toHaveBeenCalledWith("/api/v1/admin/teams/1", data);
    });

    it("deleteTeam calls correct endpoint", async () => {
        await teamsApi.deleteTeam(1);
        expect(api.delete).toHaveBeenCalledWith("/api/v1/admin/teams/1");
    });
});
