import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TopCallerCallsDialog } from "./top-caller-calls-dialog";
import { TopCaller } from "../types";

// Mock useCallLogs
const mockUseCallLogs = vi.fn();
vi.mock("@features/call-logs/hooks/use-call-logs", () => ({
    useCallLogs: (filters: unknown, options: unknown) => mockUseCallLogs(filters, options),
}));

describe("TopCallerCallsDialog", () => {
    const mockCaller: TopCaller = {
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
    };

    const mockLogsResponse = {
        data: [
            {
                id: 1,
                device_id: 10,
                phone_number: "+91 98400 12345",
                contact_name: "Acme Corp",
                phone_contact_name: "Acme Office",
                call_type: "incoming",
                call_outcome: "Connected",
                duration: 150,
                timestamp: "2026-10-27T10:30:00Z",
                sim_slot: 0,
                classification: {
                    id: 1,
                    classification: "business",
                    classified_by: 1,
                    classified_at: "2026-10-27T10:35:00Z",
                },
                created_at: "2026-10-27T10:35:00Z",
            },
            {
                id: 2,
                device_id: 10,
                phone_number: "+91 98400 67890",
                contact_name: null,
                phone_contact_name: null,
                call_type: "missed",
                call_outcome: "Missed",
                duration: 0,
                timestamp: "2026-10-27T11:00:00Z",
                sim_slot: 1,
                classification: null,
                created_at: "2026-10-27T11:00:00Z",
            },
        ],
        meta: {
            current_page: 1,
            from: 1,
            last_page: 1,
            per_page: 15,
            to: 2,
            total: 2,
        },
    };

    it("renders agent header and quick KPIs overview when open", () => {
        mockUseCallLogs.mockReturnValue({
            data: mockLogsResponse,
            isLoading: false,
            isError: false,
        });

        render(
            <TopCallerCallsDialog
                caller={mockCaller}
                open={true}
                onOpenChange={vi.fn()}
                dateFrom="2026-10-27"
                dateTo="2026-10-27"
            />
        );

        expect(screen.getByText("Calls Handled by Abirami Sureshsharma")).toBeInTheDocument();
        expect(screen.getByText("AXNPL-192")).toBeInTheDocument();
        expect(screen.getByText("Service Team")).toBeInTheDocument();
        expect(screen.getByText("2026-10-27")).toBeInTheDocument();

        // KPIs in dialog strip
        expect(screen.getByText("195")).toBeInTheDocument(); // Total Calls
        expect(screen.getByText("120")).toBeInTheDocument(); // Connected
        expect(screen.getByText("31")).toBeInTheDocument();  // Missed
        expect(screen.getByText("5h 3m")).toBeInTheDocument(); // Talk time
    });

    it("renders call rows with customer, outcome, duration, and SIM information", () => {
        mockUseCallLogs.mockReturnValue({
            data: mockLogsResponse,
            isLoading: false,
            isError: false,
        });

        render(
            <TopCallerCallsDialog
                caller={mockCaller}
                open={true}
                onOpenChange={vi.fn()}
            />
        );

        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
        expect(screen.getByText("+91 98400 12345")).toBeInTheDocument();
        expect(screen.getAllByText("Connected").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Missed").length).toBeGreaterThan(0);
        expect(screen.getByText("2m 30s")).toBeInTheDocument();
        expect(screen.getByText("SIM 1")).toBeInTheDocument();
        expect(screen.getByText("SIM 2")).toBeInTheDocument();
    });

    it("passes current filter options (outcomes, type, sim) to useCallLogs hook", () => {
        mockUseCallLogs.mockReturnValue({
            data: mockLogsResponse,
            isLoading: false,
            isError: false,
        });

        render(
            <TopCallerCallsDialog
                caller={mockCaller}
                open={true}
                onOpenChange={vi.fn()}
                dateFrom="2026-10-20"
                dateTo="2026-10-27"
                filters={{
                    dateRange: undefined,
                    outcome: "Connected",
                    type: "BUSINESS",
                    simSlot: 0,
                    contactFilter: "external",
                }}
            />
        );

        expect(mockUseCallLogs).toHaveBeenCalledWith(
            expect.objectContaining({
                agents: [101],
                start_date: "2026-10-20",
                end_date: "2026-10-27",
                outcomes: ["Connected"],
                classifications: ["business"],
                sim_slot: 0,
                contact_filter: "external",
            }),
            expect.objectContaining({
                enabled: true,
            })
        );
    });

    it("calls onOpenChange with false when Close button is clicked", () => {
        mockUseCallLogs.mockReturnValue({
            data: mockLogsResponse,
            isLoading: false,
            isError: false,
        });

        const onOpenChange = vi.fn();
        render(
            <TopCallerCallsDialog
                caller={mockCaller}
                open={true}
                onOpenChange={onOpenChange}
            />
        );

        const closeButtons = screen.getAllByRole("button", { name: /^close$/i });
        fireEvent.click(closeButtons[0]);

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });
});
