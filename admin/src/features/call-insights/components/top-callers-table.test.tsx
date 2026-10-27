import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TopCallersTable } from "./top-callers-table";
import { TopCaller } from "../types";

vi.mock("@features/call-logs/hooks/use-call-logs", () => ({
    useCallLogs: vi.fn(() => ({
        data: { data: [], meta: { total: 0 } },
        isLoading: false,
        isError: false,
    })),
}));

describe("TopCallersTable", () => {
    const mockData: TopCaller[] = [
        {
            rank: 1,
            id: 101,
            agent: "Abirami Sureshsharma",
            employee_code: "AXNPL-192",
            team: "Service Team",
            first_call_time: "09:15 AM",
            total_calls: 195,
            connected: 120,
            missed: 31,
            avg_duration: "2m 30s",
            total_duration: "5h 3m",
            total_duration_raw: 18180,
            handling_rate: 61.5,
        },
        {
            rank: 2,
            id: 102,
            agent: "Abirami Online",
            employee_code: "AXNPL-144",
            team: "Online",
            first_call_time: "10:00 AM",
            total_calls: 185,
            connected: 88,
            missed: 57,
            avg_duration: "3m 10s",
            total_duration: "9h 45m",
            total_duration_raw: 35100,
            handling_rate: 47.6,
        },
    ];

    it("renders table header and badges", () => {
        render(<TopCallersTable data={mockData} />);

        expect(screen.getByText("Top Callers Leaderboard")).toBeInTheDocument();
        expect(screen.getByText("Service Team")).toBeInTheDocument();
        expect(screen.getByText("Online")).toBeInTheDocument();
    });

    it("renders agent rows with call stats and handling rate", () => {
        render(<TopCallersTable data={mockData} />);

        expect(screen.getByText("Abirami Sureshsharma")).toBeInTheDocument();
        expect(screen.getByText("AXNPL-192")).toBeInTheDocument();
        expect(screen.getByText("195")).toBeInTheDocument();
        expect(screen.getByText("120")).toBeInTheDocument();
        expect(screen.getByText("31")).toBeInTheDocument();
        expect(screen.getByText("61.5%")).toBeInTheDocument();
        expect(screen.getByText("5h 3m")).toBeInTheDocument();

        expect(screen.getByText("Abirami Online")).toBeInTheDocument();
        expect(screen.getByText("47.6%")).toBeInTheDocument();
    });

    it("renders empty state message when data is empty", () => {
        render(<TopCallersTable data={[]} />);

        expect(
            screen.getByText("No top callers data available for the selected criteria.")
        ).toBeInTheDocument();
    });

    it("opens call details popup when View Calls is clicked", () => {
        render(<TopCallersTable data={mockData} dateFrom="2026-10-27" dateTo="2026-10-27" />);

        const viewCallsButtons = screen.getAllByRole("button", { name: /view calls/i });
        expect(viewCallsButtons.length).toBe(2);

        // Click on the first agent's View Calls button
        fireEvent.click(viewCallsButtons[0]);

        // Dialog should open with the agent's name in title
        expect(screen.getByText("Calls Handled by Abirami Sureshsharma")).toBeInTheDocument();
    });
});
