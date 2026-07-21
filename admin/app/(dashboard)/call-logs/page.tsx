"use client";

import { useCallLogs, type CallLogFilters as FilterTypes } from "@features/call-logs/hooks/use-call-logs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shared/components/ui/table";
import { format } from "date-fns";
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, HelpCircle, PhoneOff, Ban, Download } from "lucide-react";
import { Button } from "@shared/components/ui/button";
import { exportCallLogsCsv } from "@features/call-logs/utils/export-call-logs-csv";
import { CallActions } from "@features/call-logs/components/call-actions";
import { formatDuration } from "@shared/utils/time";
import { formatClassificationMetadata } from "@features/call-logs/utils/format-metadata";
import { useState, useMemo } from "react";
import { CallLogSearch } from "@features/call-logs/components/call-log-search";
import { CallLogFilters } from "@features/call-logs/components/call-log-filters";
import { CallLogPagination } from "@features/call-logs/components/call-log-pagination";
import { useSearchParams } from "next/navigation";
import { getApiErrorMessage } from "@shared/utils/error";
import { useAuth } from "@features/auth/hooks/use-auth";

/**
 * Call Logs page - displays paginated call log list using API hook
 */
export default function CallLogsPage() {
    const searchParams = useSearchParams();

    // Parse initial filters from URL
    const initialFilters: FilterTypes = {
        page: Number(searchParams.get("page")) || 1,
        per_page: Number(searchParams.get("per_page")) || 25,
        search: searchParams.get("search") || undefined,
        start_date: searchParams.get("start_date") || undefined,
        end_date: searchParams.get("end_date") || undefined,
        types: searchParams.getAll("types[]") as ("incoming" | "outgoing" | "missed" | "rejected" | "blocked" | "unknown")[] | undefined,
        outcomes: searchParams.getAll("outcomes[]") as ("Connected" | "Missed" | "No Answer")[] | undefined,
        classifications: searchParams.has("classifications[]")
            ? (searchParams.getAll("classifications[]").filter(Boolean) as ("business" | "personal" | "ignored")[])
            : ["business"],
        agents: searchParams.getAll("agents[]").map(Number).filter(n => !isNaN(n)),
        team_ids: searchParams.getAll("team_ids[]").map(Number).filter(n => !isNaN(n)),
    };

    // If arrays are empty from getAll, they should be undefined to avoid sending empty params to API if that's how hooks work
    // However, getAll returns [] if not found. Let's clean them up.
    if (initialFilters.types?.length === 0) delete initialFilters.types;
    if (initialFilters.outcomes?.length === 0) delete initialFilters.outcomes;
    if (searchParams.has("classifications[]") && initialFilters.classifications?.length === 0) {
        delete initialFilters.classifications;
    }
    if (initialFilters.agents?.length === 0) delete initialFilters.agents;
    if (initialFilters.team_ids?.length === 0) delete initialFilters.team_ids;

    const [filters, setFilters] = useState<FilterTypes>(initialFilters);
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const { user } = useAuth();
    const isAdmin = user?.roles?.some(role => ['super-admin', 'admin'].includes(role));

    const activeFilters = useMemo(() => {
        if (!user || !isAdmin) {
            return {
                ...filters,
                classifications: ["business"] as ("business" | "personal" | "ignored")[],
            };
        }
        return filters;
    }, [filters, user, isAdmin]);

    const canExport = Boolean(activeFilters.start_date && activeFilters.end_date);

    const { data, isLoading, isError } = useCallLogs(activeFilters);

    const handleExport = async () => {
        if (!canExport) {
            return;
        }

        setIsExporting(true);
        setExportError(null);

        try {
            await exportCallLogsCsv(activeFilters);
        } catch (error) {
            setExportError(
                getApiErrorMessage(error, "Failed to export call logs")
            );
        } finally {
            setIsExporting(false);
        }
    };

    const callLogs = data?.data ?? [];
    const meta = data?.meta;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Call Logs</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        View and manage call log entries
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleExport}
                    disabled={!canExport || isExporting}
                    title={
                        canExport
                            ? "Export filtered call logs as CSV"
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

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <CallLogSearch
                    value={filters.search}
                    onChange={(search) => setFilters({ ...filters, page: 1, search })}
                />
                <CallLogFilters
                    filters={filters}
                    onChange={setFilters}
                />
            </div>

            <div className="space-y-4 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Phone Number</TableHead>
                                <TableHead>Contact Name</TableHead>
                                <TableHead>Device</TableHead>
                                <TableHead>SIM</TableHead>
                                <TableHead>Agent</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Call Type</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={12} className="h-24 text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : isError ? (
                                <TableRow>
                                    <TableCell colSpan={12} className="h-24 text-center text-red-500">
                                        Failed to load call logs
                                    </TableCell>
                                </TableRow>
                            ) : callLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={12} className="h-24 text-center">
                                        No call logs found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                callLogs.map((log) => {

                                    return (
                                        <TableRow key={log.id}>
                                            <TableCell>
                                                {log.call_type === "incoming" && (
                                                    <PhoneIncoming className="h-4 w-4 text-blue-500" />
                                                )}
                                                {log.call_type === "outgoing" && (
                                                    <PhoneOutgoing className="h-4 w-4 text-green-500" />
                                                )}
                                                {log.call_type === "missed" && (
                                                    <PhoneMissed className="h-4 w-4 text-red-500" />
                                                )}
                                                {log.call_type === "rejected" && (
                                                    <PhoneOff className="h-4 w-4 text-orange-500" />
                                                )}
                                                {log.call_type === "blocked" && (
                                                    <Ban className="h-4 w-4 text-gray-500" />
                                                )}
                                                {log.call_type === "unknown" && (
                                                    <HelpCircle className="h-4 w-4 text-gray-500" />
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {/* Device-synced contact name (if any) shown above the phone number */}
                                                {log.phone_contact_name ? (
                                                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                                        {log.phone_contact_name}
                                                    </div>
                                                ) : null}
                                                <div>{log.phone_number}</div>
                                            </TableCell>
                                            <TableCell>
                                                {/* Central contact name from directory */}
                                                <span className="text-sm font-medium">
                                                    {log.contact_name || "-"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                                    {log.device_name || "-"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                                    {log.sim_slot !== null && log.sim_slot !== undefined ? `SIM ${log.sim_slot + 1}` : "-"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                                    {log.agent_name || "-"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {formatDuration(log.duration)}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${log.call_type === "incoming"
                                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                                        : log.call_type === "outgoing"
                                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                                            : log.call_type === "missed"
                                                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                                                : log.call_type === "rejected"
                                                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                                                    : log.call_type === "blocked"
                                                                        ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                                                                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}
                                                >
                                                    {log.call_type}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(log.timestamp), "MMM d, h:mm a")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    {log.contact_notes && (
                                                        <div className="text-xs text-zinc-500">
                                                            <span className="font-medium">Contact:</span> {log.contact_notes}
                                                        </div>
                                                    )}
                                                    {log.classification?.note && (
                                                        <div className="text-sm">
                                                            {log.classification.note}
                                                        </div>
                                                    )}
                                                    {log.classification?.metadata && (
                                                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                                            {formatClassificationMetadata(log.classification.metadata)}
                                                        </div>
                                                    )}
                                                    {!log.contact_notes && !log.classification?.note && !log.classification?.metadata && "-"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${log.classification?.classification === "business"
                                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                                        : log.classification?.classification === "personal"
                                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                                            : log.classification?.classification === "ignored"
                                                                ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                                                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                                        }`}
                                                >
                                                    {log.classification
                                                        ? log.classification.classification.charAt(0).toUpperCase() +
                                                        log.classification.classification.slice(1)
                                                        : "Unclassified"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <CallActions callLog={log} />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {meta && (
                    <CallLogPagination
                        page={meta.current_page}
                        perPage={meta.per_page}
                        total={meta.total}
                        onChange={(page, perPage) =>
                            setFilters({ ...filters, page, per_page: perPage })
                        }
                    />
                )}
            </div>
        </div>
    );
}
