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
import { PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react";
import { CallActions } from "@features/call-logs/components/call-actions";
import { formatDuration } from "@shared/utils/time";
import { getCallStatus } from "@shared/utils/call";
import { useState } from "react";
import { CallLogSearch } from "@features/call-logs/components/call-log-search";
import { CallLogFilters } from "@features/call-logs/components/call-log-filters";
import { CallLogPagination } from "@features/call-logs/components/call-log-pagination";

/**
 * Call Logs page - displays paginated call log list using API hook
 */
export default function CallLogsPage() {
    const [filters, setFilters] = useState<FilterTypes>({
        page: 1,
        per_page: 25,
    });

    const { data, isLoading, isError } = useCallLogs(filters);

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
            </div>

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
                                <TableHead>Duration</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : isError ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center text-red-500">
                                        Failed to load call logs
                                    </TableCell>
                                </TableRow>
                            ) : callLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        No call logs found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                callLogs.map((log) => {
                                    const status = getCallStatus(log.call_type, log.duration);

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
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {/* Contact name (if any) shown above the phone number */}
                                                {log.contact_name ? (
                                                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                                        {log.contact_name}
                                                    </div>
                                                ) : null}
                                                <div>{log.phone_number}</div>
                                            </TableCell>
                                            <TableCell>
                                                {formatDuration(log.duration)}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status === "Connected"
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                                        : status === "No Answer"
                                                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}`}
                                                >
                                                    {status}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(log.timestamp), "MMM d, h:mm a")}
                                            </TableCell>
                                            <TableCell>
                                                {log.contact_notes ?? "-"}
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
