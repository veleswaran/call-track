import { render, screen } from "@testing-library/react";
import { MissedCallSummaryWidgets } from "./missed-call-summary-widgets";
import { EscalationSummary } from "../types/escalation";
import { describe, it, expect } from "vitest";

describe("MissedCallSummaryWidgets", () => {
    it("renders loading state skeleton", () => {
        const { container } = render(<MissedCallSummaryWidgets isLoading={true} />);
        expect(screen.getByText("Total Missed")).toBeInTheDocument();
        expect(screen.getByText("Pending")).toBeInTheDocument();
        expect(screen.getByText("Unattended")).toBeInTheDocument();
        expect(screen.getByText("Resolved")).toBeInTheDocument();
        expect(container.querySelectorAll(".animate-pulse").length).toBe(4);
    });

    it("renders summary values correctly", () => {
        const mockSummary: EscalationSummary = {
            total_missed: 50,
            active_missed: 12,
            pending: 5,
            unattended: 7,
            resolved: 38,
        };

        render(<MissedCallSummaryWidgets summary={mockSummary} isLoading={false} />);
        expect(screen.getByText("12")).toBeInTheDocument();
        expect(screen.getByText("/ 50")).toBeInTheDocument();
        expect(screen.getByText("5")).toBeInTheDocument();
        expect(screen.getByText("7")).toBeInTheDocument();
        expect(screen.getByText("38")).toBeInTheDocument();
    });

    it("renders default fallback zeros when summary is undefined", () => {
        render(<MissedCallSummaryWidgets summary={undefined} isLoading={false} />);
        expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(3);
        expect(screen.getByText("/ 0")).toBeInTheDocument();
    });
});
