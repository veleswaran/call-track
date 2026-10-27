import { render, screen } from "@testing-library/react";
import { ReportSummary } from "./report-summary";
import { describe, it, expect } from "vitest";

describe("ReportSummary", () => {
    const mockMetrics = [
        { label: "TOTAL CALLS", value: "150" },
        { label: "missed calls", value: "10" },
    ];

    it("renders loading state skeleton cards", () => {
        const { container } = render(<ReportSummary metrics={[]} isLoading={true} />);
        expect(container.querySelectorAll(".animate-pulse").length).toBe(6);
    });

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

    it("renders Missed Calls with specialized card when sub_metrics are present", () => {
        const metrics = [
            {
                label: "Missed Calls",
                value: "45",
                percentage: 12,
                sub_metrics: [
                    { label: "Unattended", value: 5, color: "bg-red-500" },
                    { label: "Pending", value: 10, color: "bg-amber-500" },
                    { label: "Resolved", value: 30, color: "bg-emerald-500" },
                    { label: "Total", value: 45, color: "bg-blue-500" },
                ],
            },
        ];

        render(<ReportSummary metrics={metrics} />);
        expect(screen.getByText("Missed Calls")).toBeInTheDocument();
        expect(screen.getByText("45")).toBeInTheDocument();
    });

    it("renders general metric with percentage, color, icon, and sub_metrics", () => {
        const metrics = [
            {
                label: "Avg Call Duration",
                value: "2m 30s",
                percentage: -5,
                icon: "clock",
                color: "text-blue-500",
                sub_metrics: [
                    { label: "Inbound", value: "1m 45s", color: "bg-indigo-500" },
                ],
            },
            {
                label: "Resolved Cases",
                value: "80",
                percentage: 15,
                icon: "check-circle",
            },
        ];

        render(<ReportSummary metrics={metrics} />);
        expect(screen.getByText("Avg Call Duration")).toBeInTheDocument();
        expect(screen.getByText("-5%")).toBeInTheDocument();
        expect(screen.getByText("Inbound: 1m 45s")).toBeInTheDocument();
        expect(screen.getByText("15%")).toBeInTheDocument();
    });
});
