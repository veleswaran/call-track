import { api } from "@shared/api/api";
import { PaginatedResponse, ResourceResponse, Team } from "@shared/types";

export const teamsApi = {
    /**
     * List all teams (paginated)
     */
    async getTeams(params?: {
        page?: number;
        per_page?: number;
    }): Promise<PaginatedResponse<Team>> {
        const query = new URLSearchParams();
        if (params?.page) query.append("page", params.page.toString());
        if (params?.per_page) query.append("per_page", params.per_page.toString());

        return api.get<PaginatedResponse<Team>>(`/api/v1/admin/teams?${query.toString()}`);
    },

    /**
     * Get a single team by ID
     */
    async getTeam(id: number): Promise<ResourceResponse<Team>> {
        return api.get<ResourceResponse<Team>>(`/api/v1/admin/teams/${id}`);
    },

    /**
     * Create a new team
     */
    async createTeam(data: { name: string }): Promise<ResourceResponse<Team>> {
        return api.post<ResourceResponse<Team>>("/api/v1/admin/teams", data);
    },

    /**
     * Add a member to a team (or assign as manager)
     */
    async addMember(
        teamId: number,
        data: { agent_id: number; role: "MANAGER" | "MEMBER" }
    ): Promise<void> {
        return api.post(`/api/v1/admin/teams/${teamId}/members`, data);
    },

    /**
     * Remove a member from a team
     */
    async removeMember(teamId: number, agentId: number): Promise<void> {
        return api.delete(`/api/v1/admin/teams/${teamId}/members/${agentId}`);
    },

    /**
     * Update a member's role in a team
     */
    async updateMemberRole(
        teamId: number,
        agentId: number,
        role: "MANAGER" | "MEMBER"
    ): Promise<void> {
        return api.patch(`/api/v1/admin/teams/${teamId}/members/${agentId}`, { role });
    },

    /**
     * Update a team's name
     */
    async updateTeam(
        id: number,
        data: { name: string }
    ): Promise<ResourceResponse<Team>> {
        return api.patch<ResourceResponse<Team>>(`/api/v1/admin/teams/${id}`, data);
    },

    /**
     * Delete a team
     */
    async deleteTeam(id: number): Promise<void> {
        return api.delete(`/api/v1/admin/teams/${id}`);
    },
};
