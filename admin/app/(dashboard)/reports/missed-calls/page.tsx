"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { MissedCallsFilters } from "@features/missed-calls/components/missed-calls-filters";
import { MissedCallSummaryWidgets } from "@features/missed-calls/components/missed-call-summary-widgets";
import { MissedCallsTable } from "@features/missed-calls/components/missed-calls-table";
import { MissedCallsAgentSummary } from "@features/missed-calls/components/missed-calls-agent-summary";
import { useEscalationInsights } from "@features/missed-calls/api/get-escalations";
import { GetEscalationsParams } from "@features/missed-calls/types/escalation";
import { exportMissedCallsCsv } from "@features/missed-calls/utils/export-missed-calls-csv";
import { CallLogPagination } from "@features/call-logs/components/call-log-pagination";
import { Button } from "@shared/components/ui/button";
import { getApiErrorMessage } from "@shared/utils/error";
import { useAuth } from "@features/auth/hooks/use-auth";

export default function MissedCallsInsightsPage() {
    const today = format(new Date(), "yyyy-MM-dd");

    const [filters, setFilters] = useState<GetEscalationsParams>({
        page: 1,
        per_page: 20,
        status: ["pending", "unattended"],
        date_from: today,
        date_to: today,
        types: ["BUSINESS"],
    });

    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const { user } = useAuth();
    const isAdmin = user?.roles?.some(role => ['super-admin', 'admin'].includes(role));

    const activeFilters = useMemo(() => {
        if (!user || !isAdmin) {
            return {
                ...filters,
                types: ["BUSINESS"],
            };
        }
        return filters;
    }, [filters, user, isAdmin]);

    const canExport = Boolean(activeFilters.date_from && activeFilters.date_to);

    const { data, isLoading } = useEscalationInsights(activeFilters);

    const handleExport = async () => {
        if (!canExport) {
            return;
        }

        setIsExporting(true);
        setExportError(null);

        try {
            await exportMissedCallsCsv(activeFilters);
        } catch (error) {
            setExportError(
                getApiErrorMessage(error, "Failed to export missed calls")
            );
        } finally {
            setIsExporting(false);
        }
    };

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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Missed Call Insights</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Track and manage missed call escalations and SLA performance
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleExport}
                    disabled={!canExport || isExporting}
                    title={
                        canExport
                            ? "Export filtered missed calls as CSV (max 32-day range)"
                            : "Select a date range to export"
                    }
                >
                    <Download className="mr-2 h-4 w-4" />
                    {isExporting ? "Exporting..." : "Export CSV"}
                </Button>
            </div>

            {exportError && (
                <p className="text-sm text-red-500">{exportError}</p>
            )}

            <MissedCallsFilters onFilterChange={handleFilterChange} />
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:w-72 lg:shrink-0">
                    <MissedCallSummaryWidgets
                        summary={data?.meta?.summary}
                        isLoading={isLoading}
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <MissedCallsAgentSummary
                        agentSummary={data?.meta?.agent_summary}
                        isLoading={isLoading}
                    />
                </div>
            </div>

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
