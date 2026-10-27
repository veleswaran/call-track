import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TopCallDurationTable } from "./top-call-duration-table";
import { TopCaller } from "../types";

vi.mock("./top-caller-calls-dialog", () => ({
    TopCallerCallsDialog: ({ open, caller, onOpenChange }: { open: boolean; caller: TopCaller | null; onOpenChange: (o: boolean) => void }) => (
        open ? (
            <div data-testid="caller-calls-dialog">
                <span>Dialog for {caller?.agent}</span>
                <button onClick={() => onOpenChange(false)}>Close</button>
            </div>
        ) : null
    ),
}));

describe("TopCallDurationTable", () => {
    const mockData: TopCaller[] = [
        {
            rank: 1,
            id: 101,
            agent: "Abirami Suresh",
            employee_code: "AXNPL-192",
            team: "Service",
            first_call_time: "09:30 AM",
            total_calls: 50,
            connected: 45,
            missed: 5,
            handling_rate: 90,
            total_duration: "3h 20m",
            total_duration_raw: 12000,
            avg_duration: "4m 00s",
        },
        {
            rank: 2,
            id: 102,
            agent: "Sonia Reddy",
            employee_code: "AXNPL-193",
            team: "Sales",
            first_call_time: "10:00 AM",
            total_calls: 40,
            connected: 35,
            missed: 5,
            handling_rate: 87.5,
            total_duration: "2h 30m",
            total_duration_raw: 9000,
            avg_duration: "3m 45s",
        },
    ];

    it("renders table header and rows sorted by duration", () => {
        render(<TopCallDurationTable data={mockData} />);

        expect(screen.getByText("Top Call Duration Leaderboard")).toBeInTheDocument();
        expect(screen.getByText("Abirami Suresh")).toBeInTheDocument();
        expect(screen.getByText("Sonia Reddy")).toBeInTheDocument();
        expect(screen.getByText("3h 20m")).toBeInTheDocument();
    });

    it("renders empty state when data is empty", () => {
        render(<TopCallDurationTable data={[]} />);

        expect(screen.getByText("No duration data available.")).toBeInTheDocument();
    });

    it("opens caller details dialog when View Calls button is clicked", () => {
        render(<TopCallDurationTable data={mockData} />);

        const viewCallsButtons = screen.getAllByRole("button", { name: /view calls/i });
        fireEvent.click(viewCallsButtons[0]);

        expect(screen.getByTestId("caller-calls-dialog")).toBeInTheDocument();
        expect(screen.getByText("Dialog for Abirami Suresh")).toBeInTheDocument();
    });
});
