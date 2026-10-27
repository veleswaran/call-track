import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportCallLogsCsv } from "./export-call-logs-csv";
import { api } from "@shared/api/api";

vi.mock("@shared/api/api", () => ({
    api: {
        download: vi.fn(),
    },
}));

describe("exportCallLogsCsv", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-url");
        globalThis.URL.revokeObjectURL = vi.fn();
    });

    it("should call api.download and trigger file download", async () => {
        const mockBlob = new Blob(["test"], { type: "text/csv" });
        vi.mocked(api.download).mockResolvedValueOnce({
            blob: mockBlob,
            filename: "call-logs.csv",
        });

        await exportCallLogsCsv({
            agents: ["1"],
            outcomes: ["connected"],
            start_date: "2026-10-01",
            end_date: "2026-10-27",
            page: 1,
            per_page: 10,
        });

        expect(api.download).toHaveBeenCalledWith(
            expect.stringContaining("/api/v1/admin/call-logs/export?")
        );
        expect(api.download).toHaveBeenCalledWith(
            expect.stringContaining("agents%5B%5D=1")
        );
        expect(globalThis.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    });
});
