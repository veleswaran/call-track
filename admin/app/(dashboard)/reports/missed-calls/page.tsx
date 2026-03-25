"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MissedCallsFilters } from "@features/missed-calls/components/missed-calls-filters";
import { MissedCallSummaryWidgets } from "@features/missed-calls/components/missed-call-summary-widgets";
import { MissedCallsTable } from "@features/missed-calls/components/missed-calls-table";
import { useEscalationInsights } from "@features/missed-calls/api/get-escalations";
import { GetEscalationsParams } from "@features/missed-calls/types/escalation";
import { CallLogPagination } from "@features/call-logs/components/call-log-pagination";

export default function MissedCallsInsightsPage() {
    const today = format(new Date(), "yyyy-MM-dd");

    const [filters, setFilters] = useState<GetEscalationsParams>({
        page: 1,
        per_page: 20,
        status: ["pending", "unattended"],
        date_from: today,
        date_to: today,
    });

    const { data, isLoading } = useEscalationInsights(filters);

    const handleFilterChange = (newFilters: Partial<GetEscalationsParams>) => {
        setFilters((prev: GetEscalationsParams) => ({
            ...prev,
            ...newFilters,
            page: 1, // Reset to first page on filter change
        }));
    };

    const handlePageChange = (page: number, perPage: number) => {
        setFilters((prev: GetEscalationsParams) => ({
            ...prev,
            page,
            per_page: perPage,
        }));
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Missed Call Insights</h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Track and manage missed call escalations and SLA performance
                </p>
            </div>

            <MissedCallsFilters onFilterChange={handleFilterChange} />
            <MissedCallSummaryWidgets
                summary={data?.meta?.summary}
                isLoading={isLoading}
            />


            <div className="space-y-4">
                <MissedCallsTable
                    data={data?.data ?? []}
                    isLoading={isLoading}
                />

                {data?.meta && (
                    <CallLogPagination
                        page={data.meta.current_page}
                        perPage={data.meta.per_page}
                        total={data.meta.total}
                        onChange={handlePageChange}
                    />
                )}
            </div>
        </div>
    );
}
