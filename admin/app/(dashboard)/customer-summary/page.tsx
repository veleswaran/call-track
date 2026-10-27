"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@features/auth/hooks/use-auth";
import {
    CustomerSummaryFiltersData,
    CustomerSummarySortKey,
    SortOrder,
} from "@features/customer-summary/types";
import { CustomerSummaryFilters } from "@features/customer-summary/components/customer-summary-filters";
import { CustomerSummaryMetrics } from "@features/customer-summary/components/customer-summary-metrics";
import { CustomerSummaryTable } from "@features/customer-summary/components/customer-summary-table";
import {
    useCustomerSummaryQuery,
    useCustomerSummaryMetricsQuery,
} from "@features/customer-summary/hooks/use-customer-summary";

export default function CustomerSummaryPage() {
    const { user } = useAuth();
    const isAdmin = user?.roles?.some((role) => ["super-admin", "admin"].includes(role));

    const [page, setPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(15);
    const [sortBy, setSortBy] = useState<CustomerSummarySortKey | null>("total_calls");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    const [filters, setFilters] = useState<CustomerSummaryFiltersData>({
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
        tab: "all",
    });

    const { from: dateRangeFrom, to: dateRangeTo } = filters.dateRange ?? {};

    const formattedFrom = dateRangeFrom ? format(dateRangeFrom, "yyyy-MM-dd") : undefined;
    const formattedTo = dateRangeTo ? format(dateRangeTo, "yyyy-MM-dd") : undefined;

    const handleSort = (key: CustomerSummarySortKey) => {
        if (sortBy === key) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(key);
            setSortOrder("desc");
        }
        setPage(1);
    };

    const baseQueryParams = {
        start_date: formattedFrom,
        end_date: formattedTo,
        outcomes: filters.outcome && filters.outcome !== "all" ? [filters.outcome] : undefined,
        types: user && isAdmin ? (filters.type === "all" ? undefined : [filters.type]) : ["BUSINESS"],
        agent_ids: filters.agentIds || undefined,
        team_ids: filters.teamIds || undefined,
        contact_filter: filters.contactFilter || undefined,
        sim_slot: filters.simSlot !== undefined && filters.simSlot !== null ? filters.simSlot : undefined,
        tab: "all",
        sort_by: sortBy || undefined,
        sort_order: sortOrder,
    };

    const paginatedQueryParams = {
        ...baseQueryParams,
        page,
        per_page: perPage,
    };

    const metricsQuery = useCustomerSummaryMetricsQuery(baseQueryParams);
    const summaryQuery = useCustomerSummaryQuery(paginatedQueryParams);

    return (
        <div className="flex flex-col gap-6 w-full pb-12">
            {/* Header */}
            <div className="bg-zinc-50 dark:bg-zinc-950 pb-5 pt-6 px-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="space-y-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                            Customer-wise Call Summary
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Customer engagement analytics: total calls, missed call frequency, talk-time, and last call details.
                        </p>
                    </div>

                    {/* Filter Bar */}
                    <CustomerSummaryFilters
                        onFilterChange={(newFilters) => {
                            setFilters(newFilters);
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="px-6 space-y-6 w-full">
                {/* 4 KPI Metrics */}
                <CustomerSummaryMetrics
                    metrics={metricsQuery.data?.data || null}
                    isLoading={metricsQuery.isLoading}
                />

                {/* Main Customer Summary Table */}
                <CustomerSummaryTable
                    data={summaryQuery.data?.data || []}
                    isLoading={summaryQuery.isLoading}
                    page={page}
                    perPage={perPage}
                    total={summaryQuery.data?.meta?.total || 0}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    onPageChange={(newPage, newPerPage) => {
                        setPage(newPage);
                        setPerPage(newPerPage);
                    }}
                    filters={filters}
                    dateFrom={formattedFrom}
                    dateTo={formattedTo}
                />
            </div>
        </div>
    );
}
