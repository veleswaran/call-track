import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CustomerSummaryTable } from "./customer-summary-table";
import { CustomerSummaryItem } from "../types";

vi.mock("@features/call-logs/hooks/use-call-logs", () => ({
    useCallLogs: vi.fn(() => ({
        data: { data: [], meta: { total: 0 } },
        isLoading: false,
        isError: false,
    })),
}));

describe("CustomerSummaryTable", () => {
    const mockData: CustomerSummaryItem[] = [
        {
            phone_hash: "hash123",
            customer_name: "Karthik Builders & Infrastructure",
            organization: "Karthik Group",
            phone_number: "+91 98421 78920",
            total_calls: 38,
            missed_calls: 6,
            total_duration: "4h 07m",
            total_duration_raw: 14820,
            avg_duration: "8m 30s",
            avg_duration_raw: 510,
            last_call: {
                time: "Today, 03:12 PM",
                raw_time: "2026-10-26T15:12:00",
                direction: "OUTGOING",
                duration_formatted: "12m 45s",
                is_missed: false,
                agent_name: "ANNAL",
                agent_code: "AXNPL-178",
            },
            primary_agent: {
                name: "ANNAL",
                team: "Sales",
            },
        },
    ];

    it("renders table rows, badges, and primary agent", () => {
        const onPageChange = vi.fn();

        render(
            <CustomerSummaryTable
                data={mockData}
                page={1}
                perPage={15}
                total={1}
                onPageChange={onPageChange}
            />
        );

        expect(screen.getByText("Customer-wise Call Summary")).toBeInTheDocument();
        expect(screen.getByText("Karthik Builders & Infrastructure")).toBeInTheDocument();
        expect(screen.getByText("Karthik Group")).toBeInTheDocument();
        expect(screen.getAllByText("+91 98421 78920").length).toBeGreaterThan(0);
        expect(screen.getByText("38")).toBeInTheDocument();
        expect(screen.getByText("6")).toBeInTheDocument();
        expect(screen.getByText("4h 07m")).toBeInTheDocument();
        expect(screen.getByText("8m 30s")).toBeInTheDocument();
        expect(screen.getByText("Today, 03:12 PM")).toBeInTheDocument();
        expect(screen.getByText("Out 12m 45s")).toBeInTheDocument();
        expect(screen.getAllByText("ANNAL").length).toBeGreaterThan(0);
        expect(screen.getByText("Sales")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^view details$/i })).toBeInTheDocument();
    });

    it("opens customer details popup when View Details is clicked", () => {
        const onPageChange = vi.fn();

        render(
            <CustomerSummaryTable
                data={mockData}
                page={1}
                perPage={15}
                total={1}
                onPageChange={onPageChange}
                dateFrom="2026-10-26"
                dateTo="2026-10-27"
                filters={{
                    dateRange: undefined,
                    outcome: "all",
                    type: "BUSINESS",
                }}
            />
        );

        const viewButton = screen.getByRole("button", { name: /^view details$/i });
        fireEvent.click(viewButton);

        expect(
            screen.getByText(/Customer Details: Karthik Builders & Infrastructure/i)
        ).toBeInTheDocument();
        expect(screen.getByText(/Primary: ANNAL/i)).toBeInTheDocument();
        expect(screen.getByText(/Primary Agent:/i)).toBeInTheDocument();
        expect(screen.getByText("2026-10-26 to 2026-10-27")).toBeInTheDocument();

        const openCallLogsLink = screen.getByRole("link", { name: /open in call logs/i });
        expect(openCallLogsLink).toHaveAttribute(
            "href",
            expect.stringContaining("search=%2B91+98421+78920")
        );
    });

    it("triggers onSort when sortable column headers are clicked", () => {
        const onSort = vi.fn();
        const onPageChange = vi.fn();

        render(
            <CustomerSummaryTable
                data={mockData}
                page={1}
                perPage={15}
                total={1}
                sortBy="total_calls"
                sortOrder="desc"
                onSort={onSort}
                onPageChange={onPageChange}
            />
        );

        const totalCallsBtn = screen.getByTitle("Sort by Total Calls");
        fireEvent.click(totalCallsBtn);
        expect(onSort).toHaveBeenCalledWith("total_calls");

        const missedCallsBtn = screen.getByTitle("Sort by Missed Calls");
        fireEvent.click(missedCallsBtn);
        expect(onSort).toHaveBeenCalledWith("missed_calls");

        const durationBtn = screen.getByTitle("Sort by Total Duration");
        fireEvent.click(durationBtn);
        expect(onSort).toHaveBeenCalledWith("total_duration");
    });

    it("renders empty state message when data is empty", () => {
        const onPageChange = vi.fn();

        render(
            <CustomerSummaryTable
                data={[]}
                page={1}
                perPage={15}
                total={0}
                onPageChange={onPageChange}
            />
        );

        expect(
            screen.getByText("No customer records found for the selected criteria.")
        ).toBeInTheDocument();
    });
});
