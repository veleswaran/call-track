"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
    Flame,
    UserCheck,
    Clock,
    PhoneCall,
    Hourglass,
} from "lucide-react";

import { useAuth } from "@features/auth/hooks/use-auth";
import { CallInsightsFilters } from "@features/call-insights/components/call-insights-filters";
import { TopCallersTable } from "@features/call-insights/components/top-callers-table";
import { AgentWiseInsights } from "@features/call-insights/components/agent-wise-insights";
import { FrequentlyContactedTable } from "@features/call-insights/components/frequently-contacted-table";
import { LongestCallsTable } from "@features/call-insights/components/longest-calls-table";
import { TopCallDurationTable } from "@features/call-insights/components/top-call-duration-table";
import {
    useTopCallersQuery,
    useAgentInsightsQuery,
    useFrequentlyContactedQuery,
    useLongestCallsQuery,
} from "@features/call-insights/hooks/use-call-insights";
import { CallInsightsFiltersData } from "@features/call-insights/types";
import { CallLogPagination } from "@features/call-logs/components/call-log-pagination";
import { cn } from "@shared/utils";

type InsightsTab =
    | "agent-wise"
    | "top-callers"
    | "longest-calls"
    | "frequently-contacted"
    | "top-duration";

export default function CallInsightsPage() {
    const { user } = useAuth();
    const isAdmin = user?.roles?.some((role) => ["super-admin", "admin"].includes(role));

    // Active tab: Defaults to "top-callers" matching WhatsApp Image 2026-10-22 at 8.05.35 PM.jpeg
    const [activeTab, setActiveTab] = useState<InsightsTab>("top-callers");

    const [filters, setFilters] = useState<CallInsightsFiltersData>({
        dateRange: {
            from: new Date(),
            to: new Date(),
        },
        outcome: "all",
        type: "BUSINESS",
        agentIds: null,
        teamIds: null,
        contactFilter: null,
        simSlot: null,
    });

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);

    const { from: dateFrom, to: dateTo } = filters.dateRange ?? {};
    const formattedFrom = dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined;
    const formattedTo = dateTo ? format(dateTo, "yyyy-MM-dd") : undefined;

    const baseQueryParams = {
        start_date: formattedFrom,
        end_date: formattedTo,
        outcomes: filters.outcome !== "all" ? [filters.outcome] : undefined,
        types: user && isAdmin ? (filters.type === "all" ? undefined : [filters.type]) : ["BUSINESS"],
        agent_ids: filters.agentIds || undefined,
        team_ids: filters.teamIds || undefined,
        contact_filter: filters.contactFilter || undefined,
        sim_slot: filters.simSlot !== undefined && filters.simSlot !== null ? filters.simSlot : undefined,
    };

    const paginatedQueryParams = {
        ...baseQueryParams,
        page,
        per_page: perPage,
        sort_by: activeTab === "top-duration" ? "total_duration" : undefined,
        sort_order: ("desc" as const),
    };

    // Queries
    const topCallersQuery = useTopCallersQuery(
        paginatedQueryParams,
        activeTab === "top-callers" || activeTab === "top-duration"
    );

    const agentInsightsQuery = useAgentInsightsQuery(
        baseQueryParams,
        activeTab === "agent-wise"
    );

    const frequentlyContactedQuery = useFrequentlyContactedQuery(
        paginatedQueryParams,
        activeTab === "frequently-contacted"
    );

    const longestCallsQuery = useLongestCallsQuery(
        paginatedQueryParams,
        activeTab === "longest-calls"
    );

    const tabs: Array<{ id: InsightsTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
        { id: "agent-wise", label: "Agent-wise Call Insights", icon: UserCheck },
        { id: "top-callers", label: "Top Callers", icon: Flame },
        { id: "longest-calls", label: "Longest Calls", icon: Clock },
        { id: "frequently-contacted", label: "Frequently Contacted Numbers", icon: PhoneCall },
        { id: "top-duration", label: "Top Call Duration", icon: Hourglass },
    ];

    return (
        <div className="flex flex-col gap-6 w-full pb-12">
            {/* Header */}
            <div className="bg-zinc-50 dark:bg-zinc-950 pb-5 pt-6 px-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="space-y-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                            Call Insights
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Agent-wise timeline analytics, top callers leaderboard, longest calls audit, and frequently contacted numbers.
                        </p>
                    </div>

                    {/* Filter Bar */}
                    <CallInsightsFilters onFilterChange={(newFilters) => { setFilters(newFilters); setPage(1); }} />
                </div>
            </div>

            {/* Horizontal Tab Navigation */}
            <div className="border-b border-zinc-200 dark:border-zinc-800 px-6 -mt-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setPage(1); }}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150",
                                    isActive
                                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                                )}
                            >
                                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white dark:text-zinc-900" : "text-muted-foreground")} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="px-6 space-y-6 w-full">
                {/* Tab Content Display */}
                <div>
                    {/* 1. Top Callers (Default as shown in Image 8.05.35 PM) */}
                    {activeTab === "top-callers" && (
                        <div className="space-y-4">
                            <TopCallersTable
                                data={topCallersQuery.data?.data || []}
                                isLoading={topCallersQuery.isLoading}
                                dateFrom={formattedFrom}
                                dateTo={formattedTo}
                                filters={filters}
                            />
                            {topCallersQuery.data?.meta && topCallersQuery.data.meta.total > 0 && (
                                <CallLogPagination
                                    page={page}
                                    perPage={perPage}
                                    total={topCallersQuery.data.meta.total}
                                    onChange={(newPage, newPerPage) => {
                                        setPage(newPage);
                                        setPerPage(newPerPage);
                                    }}
                                />
                            )}
                        </div>
                    )}

                    {/* 2. Agent-wise Call Insights (Image 8.06.02 PM) */}
                    {activeTab === "agent-wise" && (
                        <AgentWiseInsights
                            data={agentInsightsQuery.data || null}
                            isLoading={agentInsightsQuery.isLoading}
                            dateFrom={formattedFrom}
                            dateTo={formattedTo}
                            filters={filters}
                        />
                    )}

                    {/* 3. Longest Calls */}
                    {activeTab === "longest-calls" && (
                        <div className="space-y-4">
                            <LongestCallsTable
                                data={longestCallsQuery.data?.data || []}
                                isLoading={longestCallsQuery.isLoading}
                                dateFrom={formattedFrom}
                                dateTo={formattedTo}
                                filters={filters}
                            />
                            {longestCallsQuery.data?.meta && longestCallsQuery.data.meta.total > 0 && (
                                <CallLogPagination
                                    page={page}
                                    perPage={perPage}
                                    total={longestCallsQuery.data.meta.total}
                                    onChange={(newPage, newPerPage) => {
                                        setPage(newPage);
                                        setPerPage(newPerPage);
                                    }}
                                />
                            )}
                        </div>
                    )}

                    {/* 4. Frequently Contacted Numbers (Image 8.05.36 PM) */}
                    {activeTab === "frequently-contacted" && (
                        <div className="space-y-4">
                            <FrequentlyContactedTable
                                data={frequentlyContactedQuery.data?.data || []}
                                isLoading={frequentlyContactedQuery.isLoading}
                                dateFrom={formattedFrom}
                                dateTo={formattedTo}
                                filters={filters}
                            />
                            {frequentlyContactedQuery.data?.meta && frequentlyContactedQuery.data.meta.total > 0 && (
                                <CallLogPagination
                                    page={page}
                                    perPage={perPage}
                                    total={frequentlyContactedQuery.data.meta.total}
                                    onChange={(newPage, newPerPage) => {
                                        setPage(newPage);
                                        setPerPage(newPerPage);
                                    }}
                                />
                            )}
                        </div>
                    )}

                    {/* 5. Top Call Duration */}
                    {activeTab === "top-duration" && (
                        <div className="space-y-4">
                            <TopCallDurationTable
                                data={topCallersQuery.data?.data || []}
                                isLoading={topCallersQuery.isLoading}
                                dateFrom={formattedFrom}
                                dateTo={formattedTo}
                                filters={filters}
                            />
                            {topCallersQuery.data?.meta && topCallersQuery.data.meta.total > 0 && (
                                <CallLogPagination
                                    page={page}
                                    perPage={perPage}
                                    total={topCallersQuery.data.meta.total}
                                    onChange={(newPage, newPerPage) => {
                                        setPage(newPage);
                                        setPerPage(newPerPage);
                                    }}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
