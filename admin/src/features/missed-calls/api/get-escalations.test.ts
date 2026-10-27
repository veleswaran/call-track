import { describe, it, expect, vi, beforeEach } from "vitest";
import { getEscalations } from "./get-escalations";
import { api } from "@shared/api/api";

vi.mock("@shared/api/api", () => ({
    api: {
        get: vi.fn(),
    },
}));

describe("getEscalations API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should build query params and call api.get", async () => {
        const mockResponse = { data: [] };
        vi.mocked(api.get).mockResolvedValueOnce(mockResponse as unknown as ReturnType<typeof api.get>);

        const result = await getEscalations({
            team_ids: ["1", "2"],
            agent_id: 5,
            status: ["pending"],
            date_from: "2026-10-01",
            date_to: "2026-10-27",
            page: 1,
            per_page: 20,
            contact_filter: "internal",
            types: ["BUSINESS"],
            sim_slot: 1,
        });

        expect(api.get).toHaveBeenCalledWith(
            "/api/v1/admin/call-logs/escalations?team_ids%5B%5D=1&team_ids%5B%5D=2&agent_id=5&status%5B%5D=pending&date_from=2026-10-01&date_to=2026-10-27&page=1&per_page=20&contact_filter=internal&types%5B%5D=BUSINESS&sim_slot=1"
        );
        expect(result).toEqual(mockResponse);
    });

    it("should handle single status string", async () => {
        const mockResponse = { data: [] };
        vi.mocked(api.get).mockResolvedValueOnce(mockResponse as unknown as ReturnType<typeof api.get>);

        await getEscalations({
            status: "pending",
        });

        expect(api.get).toHaveBeenCalledWith(
            "/api/v1/admin/call-logs/escalations?status=pending"
        );
    });
});
