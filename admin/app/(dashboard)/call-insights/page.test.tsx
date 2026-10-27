import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CallInsightsPage from "./page";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock hooks
vi.mock("@features/call-insights/hooks/use-call-insights", () => ({
    useTopCallersQuery: vi.fn(),
    useAgentInsightsQuery: vi.fn(),
    useFrequentlyContactedQuery: vi.fn(),
    useLongestCallsQuery: vi.fn(),
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
    useTopCallersQuery,
    useAgentInsightsQuery,
    useFrequentlyContactedQuery,
    useLongestCallsQuery,
} from "@features/call-insights/hooks/use-call-insights";

describe("CallInsightsPage", () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });

        vi.mocked(useTopCallersQuery).mockReturnValue({
            data: {
                data: [
                    {
                        rank: 1,
                        id: 1,
                        agent: "Abirami Sureshsharma",
                        employee_code: "AXNPL-192",
                        team: "Service Team",
                        first_call_time: "09:00 AM",
                        total_calls: 195,
                        connected: 120,
                        missed: 31,
                        avg_duration: "2m 30s",
                        total_duration: "5h 3m",
                        total_duration_raw: 18180,
                        handling_rate: 61.5,
                    },
                ],
                meta: { total: 1, per_page: 15, current_page: 1 },
            },
            isLoading: false,
        } as unknown as ReturnType<typeof useTopCallersQuery>);

        vi.mocked(useAgentInsightsQuery).mockReturnValue({
            data: null,
            isLoading: false,
        } as unknown as ReturnType<typeof useAgentInsightsQuery>);

        vi.mocked(useFrequentlyContactedQuery).mockReturnValue({
            data: { data: [], meta: { total: 0 } },
            isLoading: false,
        } as unknown as ReturnType<typeof useFrequentlyContactedQuery>);

        vi.mocked(useLongestCallsQuery).mockReturnValue({
            data: { data: [], meta: { total: 0 } },
            isLoading: false,
        } as unknown as ReturnType<typeof useLongestCallsQuery>);
    });

    it("renders page header and all tab buttons", () => {
        render(
            <QueryClientProvider client={queryClient}>
                <CallInsightsPage />
            </QueryClientProvider>
        );

        expect(screen.getByRole("heading", { name: "Call Insights" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Top Callers/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Agent-wise Call Insights/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Longest Calls/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Frequently Contacted Numbers/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Top Call Duration/i })).toBeInTheDocument();
    });

    it("defaults to Top Callers tab showing leaderboard table", () => {
        render(
            <QueryClientProvider client={queryClient}>
                <CallInsightsPage />
            </QueryClientProvider>
        );

        expect(screen.getByText("Top Callers Leaderboard")).toBeInTheDocument();
        expect(screen.getByText("Abirami Sureshsharma")).toBeInTheDocument();
        expect(screen.getByText("195")).toBeInTheDocument();
        expect(screen.getByText("61.5%")).toBeInTheDocument();
    });

    it("allows switching tabs to Frequently Contacted Numbers", async () => {
        const user = userEvent.setup();
        render(
            <QueryClientProvider client={queryClient}>
                <CallInsightsPage />
            </QueryClientProvider>
        );

        const freqTab = screen.getByRole("button", { name: /Frequently Contacted Numbers/i });
        await user.click(freqTab);

        expect(screen.getByRole("heading", { name: "Frequently Contacted Numbers" })).toBeInTheDocument();
    });
});

