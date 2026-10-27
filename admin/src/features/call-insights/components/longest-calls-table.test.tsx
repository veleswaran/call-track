import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LongestCallsTable } from "./longest-calls-table";
import { LongestCall } from "../types";

describe("LongestCallsTable", () => {
    const mockData: LongestCall[] = [
        {
            id: 501,
            customer_name: "Apex Global Logistics",
            phone_number: "+91 98400 55555",
            agent: "Abirami Sureshsharma",
            employee_code: "AXNPL-192",
            team: "Service Team",
            timestamp: "27 Oct, 11:30 AM",
            direction: "OUTGOING",
            duration: "45m 12s",
            duration_raw: 2712,
            classification: "BUSINESS",
        },
        {
            id: 502,
            customer_name: "Zenith Retailers",
            phone_number: "+91 98400 66666",
            agent: "Annamalai",
            employee_code: "AXNPL-105",
            team: "Support",
            timestamp: "27 Oct, 02:15 PM",
            direction: "INCOMING",
            duration: "32m 40s",
            duration_raw: 1960,
            classification: "BUSINESS",
        },
    ];

    it("renders table header and rows with agent, customer, and duration", () => {
        render(<LongestCallsTable data={mockData} />);

        expect(screen.getByText("Longest Calls Audit")).toBeInTheDocument();
        expect(screen.getByText("Apex Global Logistics")).toBeInTheDocument();
        expect(screen.getByText("+91 98400 55555")).toBeInTheDocument();
        expect(screen.getByText("Abirami Sureshsharma")).toBeInTheDocument();
        expect(screen.getByText("45m 12s")).toBeInTheDocument();

        expect(screen.getByText("Zenith Retailers")).toBeInTheDocument();
        expect(screen.getByText("32m 40s")).toBeInTheDocument();
    });

    it("renders empty state message when data is empty", () => {
        render(<LongestCallsTable data={[]} />);

        expect(
            screen.getByText("No calls found matching the criteria.")
        ).toBeInTheDocument();
    });

    it("opens call audit details dialog when View Details is clicked", () => {
        render(
            <LongestCallsTable
                data={mockData}
                dateFrom="2026-10-27"
                dateTo="2026-10-27"
            />
        );

        const viewButtons = screen.getAllByRole("button", { name: /view details/i });
        expect(viewButtons.length).toBe(2);

        // Click on the first row's View Details button
        fireEvent.click(viewButtons[0]);

        // Dialog should open with Call Audit Details and customer name
        expect(screen.getByText("Call Audit Details")).toBeInTheDocument();
        expect(screen.getByText("#501")).toBeInTheDocument();
        expect(screen.getByText("2712s total")).toBeInTheDocument();
    });
});
