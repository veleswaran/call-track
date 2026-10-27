import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportMissedCallsCsv } from "./export-missed-calls-csv";
import { api } from "@shared/api/api";

vi.mock("@shared/api/api", () => ({
    api: {
        download: vi.fn(),
    },
}));

describe("exportMissedCallsCsv", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-url");
        globalThis.URL.revokeObjectURL = vi.fn();
    });

    it("should call api.download and trigger file download", async () => {
        const mockBlob = new Blob(["test"], { type: "text/csv" });
        vi.mocked(api.download).mockResolvedValueOnce({
            blob: mockBlob,
            filename: "missed-calls.csv",
        });

        await exportMissedCallsCsv({
            team_ids: ["1", "2"],
            status: "pending",
            date_from: "2026-10-01",
            date_to: "2026-10-27",
            page: 1,
            per_page: 10,
        });

        expect(api.download).toHaveBeenCalledWith(
            expect.stringContaining("/api/v1/admin/call-logs/escalations/export?")
        );
        expect(api.download).toHaveBeenCalledWith(
            expect.stringContaining("team_ids%5B%5D=1")
        );
        expect(globalThis.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    });
});
