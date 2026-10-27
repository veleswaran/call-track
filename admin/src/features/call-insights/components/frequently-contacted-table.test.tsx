import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FrequentlyContactedTable } from "./frequently-contacted-table";
import { FrequentlyContacted } from "../types";

vi.mock("@features/call-logs/hooks/use-call-logs", () => ({
    useCallLogs: vi.fn(() => ({
        data: { data: [], meta: { total: 0 } },
        isLoading: false,
        isError: false,
    })),
}));

describe("FrequentlyContactedTable", () => {
    const mockData: FrequentlyContacted[] = [
        {
            phone_hash: "hash1",
            customer_name: "Shri Ram Textiles & Garments",
            phone_number: "+91 94432 11984",
            account_category: "Key Enterprise Account",
            total_touchpoints: 45,
            in_count: 26,
            out_count: 19,
            in_out_ratio: "26 In / 19 Out",
            total_talk_time: "5h 24m",
            total_talk_time_raw: 19440,
            agents_handled: "Arun AS, ANNAL, Arun Karthi",
            last_contacted: "Today, 02:05 PM",
            last_contacted_raw: "2026-10-26T14:05:00",
        },
    ];

    it("renders customer details and touchpoints ratio", () => {
        render(<FrequentlyContactedTable data={mockData} />);

        expect(screen.getByText("Frequently Contacted Numbers")).toBeInTheDocument();
        expect(screen.getByText("High-Touch Accounts")).toBeInTheDocument();
        expect(screen.getByText("Shri Ram Textiles & Garments")).toBeInTheDocument();
        expect(screen.getAllByText("+91 94432 11984").length).toBeGreaterThan(0);
        expect(screen.getByText("Key Enterprise Account")).toBeInTheDocument();
        expect(screen.getByText("45")).toBeInTheDocument();
        expect(screen.getByText("26 In")).toBeInTheDocument();
        expect(screen.getByText("19 Out")).toBeInTheDocument();
        expect(screen.getByText("Arun AS")).toBeInTheDocument();
        expect(screen.getByText("+2 more")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^view$/i })).toBeInTheDocument();
    });

    it("opens customer details popup when View is clicked", () => {
        render(
            <FrequentlyContactedTable
                data={mockData}
                dateFrom="2026-10-27"
                dateTo="2026-10-27"
            />
        );

        const viewButton = screen.getByRole("button", { name: /^view$/i });
        fireEvent.click(viewButton);

        expect(
            screen.getByText(/Customer Details: Shri Ram Textiles & Garments/i)
        ).toBeInTheDocument();
        expect(screen.getByText("Last contacted Today, 02:05 PM")).toBeInTheDocument();
    });

    it("groups agent contacts by customer name when multiple agents have saved variations", () => {
        const dataWithVariations: FrequentlyContacted[] = [
            {
                phone_hash: "hash2",
                customer_name: "Sonia Reddy",
                phone_number: "+91 98765 43210",
                account_category: "Key Enterprise Account",
                total_touchpoints: 30,
                in_count: 15,
                out_count: 15,
                in_out_ratio: "15 In / 15 Out",
                total_talk_time: "3h 10m",
                total_talk_time_raw: 11400,
                agents_handled: "Nancy Moore, Emily Brown",
                last_contacted: "Today, 03:00 PM",
                last_contacted_raw: "2026-10-26T15:00:00",
                agent_contacts: [
                    { agent_name: "Nancy Moore", contact_name: "Sonia Reddy" },
                    { agent_name: "Lisa Anderson", contact_name: "Sonia Reddy" },
                    { agent_name: "Sandra Jones", contact_name: "Sonia Reddy" },
                    { agent_name: "Emily Brown", contact_name: "Amit Patel" },
                ],
            },
        ];

        render(<FrequentlyContactedTable data={dataWithVariations} />);

        // Should group 4 agent records into 2 distinct customer name variations
        expect(screen.getByText("2 name variations")).toBeInTheDocument();

        // Open details modal
        const viewButton = screen.getByRole("button", { name: /^view$/i });
        fireEvent.click(viewButton);

        // In the dialog, verify the grouped customer names
        expect(screen.getByText(/Agent Phonebook Names \(Grouped by Customer Name\):/i)).toBeInTheDocument();
        expect(screen.getByText('"Sonia Reddy"')).toBeInTheDocument();
        expect(screen.getAllByText(/Saved by/i).length).toBe(2);
        expect(screen.getByText("3 agents")).toBeInTheDocument();
        expect(screen.getByText('"Amit Patel"')).toBeInTheDocument();
        expect(screen.getByText("Emily Brown")).toBeInTheDocument();
    });
});
