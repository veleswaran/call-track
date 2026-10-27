import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CustomerSummaryMetrics } from "./customer-summary-metrics";
import { CustomerSummaryMetrics as MetricsType } from "../types";

vi.mock("@features/settings/hooks/use-settings", () => ({
    useSettingsQuery: vi.fn(() => ({
        data: { escalation_sla_hours: 2 },
    })),
}));

describe("CustomerSummaryMetrics", () => {
    const mockMetrics: MetricsType = {
        total_accounts: 2055,
        total_calls: 8539,
        connected_calls: 4861,
        connected_pct: 56.9,
        total_talk_time: "271h 48m",
        total_talk_time_raw: 978480,
        missed_calls: 462,
        sla_pending_count: 85,
        auto_resolved_count: 1313,
    };

    it("renders all 4 metric cards correctly", () => {
        render(<CustomerSummaryMetrics metrics={mockMetrics} />);

        expect(screen.getByText("Total Accounts Logged")).toBeInTheDocument();
        expect(screen.getByText("2,055")).toBeInTheDocument();
        expect(screen.getByText("Unique phone identities")).toBeInTheDocument();

        expect(screen.getByText("Customer Calls Handled")).toBeInTheDocument();
        expect(screen.getByText("8,539")).toBeInTheDocument();
        expect(screen.getByText("4,861 Connected (56.9%)")).toBeInTheDocument();

        expect(screen.getByText("Total Customer Talk-Time")).toBeInTheDocument();
        expect(screen.getByText("271h 48m")).toBeInTheDocument();
        expect(screen.getByText("Across official SIM slots")).toBeInTheDocument();

        expect(screen.getByText("Missed Calls")).toBeInTheDocument();
        expect(screen.getByText("85")).toBeInTheDocument();
        expect(screen.getByText("/ 462")).toBeInTheDocument();
        expect(screen.getByText("85 Pending")).toBeInTheDocument();
        expect(screen.getByText("1,313 Auto-Resolved (within 2h)")).toBeInTheDocument();
    });
});
