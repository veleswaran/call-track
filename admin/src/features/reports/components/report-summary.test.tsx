import { render, screen } from "@testing-library/react";
import { ReportSummary } from "./report-summary";
import { describe, it, expect } from "vitest";

describe("ReportSummary", () => {
    const mockMetrics = [
        { label: "TOTAL CALLS", value: "150" },
        { label: "missed calls", value: "10" },
    ];

    it("maps labels to links case-insensitively", () => {
        render(<ReportSummary metrics={mockMetrics} />);

        // "TOTAL CALLS" (uppercase) should still link to "/call-logs"
        const totalCallsLink = screen.getByText("TOTAL CALLS").closest('a');
        expect(totalCallsLink?.getAttribute('href')).toBe("/call-logs");

        // "missed calls" (lowercase) should still link to "/reports/missed-calls"
        const missedCallsLink = screen.getByText("missed calls").closest('a');
        expect(missedCallsLink?.getAttribute('href')).toBe("/reports/missed-calls");
    });

    it("renders value and label correctly", () => {
        render(<ReportSummary metrics={mockMetrics} />);

        expect(screen.getByText("TOTAL CALLS")).toBeInTheDocument();
        expect(screen.getByText("150")).toBeInTheDocument();
    });

    it("renders unmapped labels as plain text", () => {
        const unmappedMetrics = [{ label: "Unknown Metric", value: "99" }];
        render(<ReportSummary metrics={unmappedMetrics} />);

        const label = screen.getByText("Unknown Metric");
        expect(label.closest('a')).toBeNull();
    });
});
