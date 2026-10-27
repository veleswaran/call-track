import { describe, it, expect, vi, beforeEach } from "vitest";
import { customerSummaryApi } from "./customer-summary-api";
import { api } from "@shared/api/api";

vi.mock("@shared/api/api", () => ({
    api: {
        get: vi.fn(),
    },
}));

describe("customerSummaryApi", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getSummary", () => {
        it("should serialize parameters including arrays and booleans and call api.get", async () => {
            const mockResponse = { data: [], meta: { total: 0 } };
            vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

            const result = await customerSummaryApi.getSummary({
                tab: "all",
                page: 1,
                agent_ids: ["10", "20"],
                has_notes: true,
                empty_val: "",
                null_val: null,
            });

            expect(api.get).toHaveBeenCalledWith(
                "/api/v1/admin/customer-summary?tab=all&page=1&agent_ids%5B%5D=10&agent_ids%5B%5D=20&has_notes=1"
            );
            expect(result).toEqual(mockResponse);
        });

        it("should call without query string when params are empty", async () => {
            const mockResponse = { data: [], meta: { total: 0 } };
            vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

            await customerSummaryApi.getSummary({});
            expect(api.get).toHaveBeenCalledWith("/api/v1/admin/customer-summary");
        });
    });

    describe("getMetrics", () => {
        it("should serialize parameters and call api.get for metrics", async () => {
            const mockResponse = { data: { total_accounts: 10 } };
            vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

            const result = await customerSummaryApi.getMetrics({ tab: "with-missed" });

            expect(api.get).toHaveBeenCalledWith("/api/v1/admin/customer-summary/metrics?tab=with-missed");
            expect(result).toEqual(mockResponse);
        });
    });
});
