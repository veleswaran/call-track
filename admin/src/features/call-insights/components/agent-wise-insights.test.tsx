import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AgentWiseInsights } from "./agent-wise-insights";
import { AgentInsightsData } from "../types";

vi.mock("@features/settings/hooks/use-settings", () => ({
    useSettingsQuery: vi.fn(() => ({
        data: { escalation_sla_hours: 2 },
    })),
}));

vi.mock("@features/call-logs/hooks/use-call-logs", () => ({
    useCallLogs: vi.fn(() => ({
        data: { data: [], meta: { total: 0 } },
        isLoading: false,
        isError: false,
    })),
}));

describe("AgentWiseInsights", () => {
    const mockData: AgentInsightsData = {
        agent: {
            id: 201,
            name: "ANNAL",
            employee_code: "AXNPL-178",
            team: "Sales",
            device_hardware_id: "DEV-ANDR-8891",
            first_call_time: "03:12 PM",
            handling_rate: 37.5,
        },
        kpis: {
            calls_in_period: 72,
            connected_calls: 27,
            connected_rate: 37.5,
            missed_calls: 31,
            pending_missed_calls: 4,
            resolved_missed_calls: 27,
            sla_resolution_rate: 85,
            total_talk_time: "4h 2m",
            total_talk_time_raw: 14520,
            avg_talk_time: "3m 22s",
        },
        daily_distribution: [
            {
                date: "11 Oct (Sun)",
                raw_date: "2026-10-11",
                total_calls: 8,
                connected: 3,
                missed: 3,
                talk_duration: "28m",
                talk_duration_raw: 1680,
                performance_percentage: 37.5,
            },
        ],
        outreach_characteristics: {
            direction: {
                outbound_pct: 58,
                inbound_pct: 42,
            },
            sim_allocation: {
                sim_1_pct: 82,
                sim_2_pct: 18,
            },
            classification: {
                business_pct: 94,
                personal_pct: 6,
            },
            device_hardware_id: "DEV-ANDR-8891",
        },
    };

    it("renders agent profile card and hardware id", () => {
        render(<AgentWiseInsights data={mockData} />);

        expect(screen.getByText("ANNAL")).toBeInTheDocument();
        expect(screen.getByText("AXNPL-178")).toBeInTheDocument();
        expect(screen.getByText("Sales")).toBeInTheDocument();
        expect(screen.getByText("DEV-ANDR-8891")).toBeInTheDocument();
        expect(screen.getByText("03:12 PM")).toBeInTheDocument();
        expect(screen.getByText("Handling Rate:")).toBeInTheDocument();
        expect(screen.getAllByText("37.5%").length).toBeGreaterThan(0);
    });

    it("renders all 4 KPI cards with dynamic SLA follow-up hours and pending missed calls", () => {
        render(<AgentWiseInsights data={mockData} />);

        expect(screen.getByText("72")).toBeInTheDocument();
        expect(screen.getByText("27")).toBeInTheDocument();
        expect(screen.getByText("4")).toBeInTheDocument();
        expect(screen.getByText("/ 31")).toBeInTheDocument();
        expect(screen.getByText("4h 2m")).toBeInTheDocument();
        expect(screen.getByText("SLA: 85% Res.")).toBeInTheDocument();
        expect(screen.getByText("Follow-ups within 2h")).toBeInTheDocument();
    });

    it("renders daily distribution and outreach splits including Call Type Split and Type (BRD 7.1)", () => {
        render(<AgentWiseInsights data={mockData} />);

        expect(screen.getByText("Daily Call Distribution for ANNAL")).toBeInTheDocument();
        expect(screen.getByText("11 Oct (Sun)")).toBeInTheDocument();
        
        // Outreach Characteristics
        expect(screen.getByText("Call Type Split")).toBeInTheDocument();
        expect(screen.getByText("58% Out / 42% In")).toBeInTheDocument();
        expect(screen.getByText("Dual SIM Allocation")).toBeInTheDocument();
        expect(screen.getByText("SIM 1 (82%) / SIM 2 (18%)")).toBeInTheDocument();
        expect(screen.getByText("Type (BRD 7.1)")).toBeInTheDocument();
        expect(screen.getByText("Business (94%) / Personal (6%)")).toBeInTheDocument();
    });

    it("renders empty state message when data is null", () => {
        render(<AgentWiseInsights data={null} />);

        expect(screen.getByText(/No agent activity data available for the selected period/i)).toBeInTheDocument();
    });

    it("opens call details modal and formats full call logs link with active filters", () => {
        const filters = {
            dateRange: undefined,
            outcome: "Connected",
            type: "business",
            contactFilter: "external" as const,
            simSlot: 1,
        };

        render(
            <AgentWiseInsights
                data={mockData}
                dateFrom="2026-10-26"
                dateTo="2026-10-27"
                filters={filters}
            />
        );

        // Click View Call Logs button to open modal
        const viewButton = screen.getByRole("button", { name: /view call logs/i });
        fireEvent.click(viewButton);

        // Modal should open
        expect(screen.getByText("Call Details: ANNAL")).toBeInTheDocument();
        expect(screen.getByText(/2026-10-26 to 2026-10-27/)).toBeInTheDocument();
        expect(screen.getByText("Outcome: Connected")).toBeInTheDocument();
        expect(screen.getByText("Type: business")).toBeInTheDocument();
        expect(screen.getByText("Contact: external")).toBeInTheDocument();
        expect(screen.getByText("SIM 1")).toBeInTheDocument();

        // Verify Open in Call Logs link in modal header has all filter query parameters
        const link = screen.getByRole("link", { name: /open in call logs/i });
        expect(link).toHaveAttribute(
            "href",
            expect.stringContaining("agents%5B%5D=201")
        );
        expect(link).toHaveAttribute(
            "href",
            expect.stringContaining("start_date=2026-10-26")
        );
        expect(link).toHaveAttribute(
            "href",
            expect.stringContaining("end_date=2026-10-27")
        );
        expect(link).toHaveAttribute(
            "href",
            expect.stringContaining("outcomes%5B%5D=Connected")
        );
        expect(link).toHaveAttribute(
            "href",
            expect.stringContaining("classifications%5B%5D=business")
        );
        expect(link).toHaveAttribute(
            "href",
            expect.stringContaining("contact_filter=external")
        );
        expect(link).toHaveAttribute(
            "href",
            expect.stringContaining("sim_slot=1")
        );
    });
});
