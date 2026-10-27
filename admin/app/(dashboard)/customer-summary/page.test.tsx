import { render, screen } from "@testing-library/react";
import CustomerSummaryPage from "./page";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@features/customer-summary/hooks/use-customer-summary", () => ({
    useCustomerSummaryQuery: vi.fn(),
    useCustomerSummaryMetricsQuery: vi.fn(),
}));

vi.mock("@features/auth/hooks/use-auth", () => ({
    useAuth: vi.fn(() => ({
        user: { name: "Admin", roles: ["admin"] },
    })),
}));

vi.mock("@features/settings/hooks/use-settings", () => ({
    useSettingsQuery: vi.fn(() => ({
        data: {},
    })),
}));

import {
    useCustomerSummaryQuery,
    useCustomerSummaryMetricsQuery,
} from "@features/customer-summary/hooks/use-customer-summary";

describe("CustomerSummaryPage", () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });

        vi.mocked(useCustomerSummaryMetricsQuery).mockReturnValue({
            data: {
                data: {
                    total_accounts: 2055,
                    total_calls: 8539,
                    connected_calls: 4861,
                    connected_pct: 56.9,
                    total_talk_time: "271h 48m",
                    total_talk_time_raw: 978480,
                    missed_calls: 462,
                    sla_pending_count: 85,
                    auto_resolved_count: 1313,
                },
            },
            isLoading: false,
        } as unknown as ReturnType<typeof useCustomerSummaryMetricsQuery>);

        vi.mocked(useCustomerSummaryQuery).mockReturnValue({
            data: {
                data: [
                    {
                        phone_hash: "hash1",
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
                ],
                meta: {
                    total: 1,
                    current_page: 1,
                    per_page: 15,
                },
            },
            isLoading: false,
        } as unknown as ReturnType<typeof useCustomerSummaryQuery>);
    });

    it("renders page title, subtitle, metrics, and table", () => {
        render(
            <QueryClientProvider client={queryClient}>
                <CustomerSummaryPage />
            </QueryClientProvider>
        );

        expect(screen.getAllByText("Customer-wise Call Summary").length).toBeGreaterThan(0);
        expect(screen.getByText("Total Accounts Logged")).toBeInTheDocument();
        expect(screen.getByText("2,055")).toBeInTheDocument();
        expect(screen.getByText("Customer Calls Handled")).toBeInTheDocument();
        expect(screen.getByText("8,539")).toBeInTheDocument();
        expect(screen.getByText("Karthik Builders & Infrastructure")).toBeInTheDocument();
        expect(screen.getByText("Karthik Group")).toBeInTheDocument();
    });
});
