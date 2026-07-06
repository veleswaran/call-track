"use client";

import { useFormContext } from "react-hook-form";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shared/components/ui/table";
import { FormField, FormItem, FormControl } from "@shared/components/ui/form";
import { Checkbox } from "@shared/components/ui/checkbox";
import { Minus } from "lucide-react";

interface FilterRow {
    id: string;
    label: string;
    keys: {
        callLogs: string;
        missedCalls: string | null;
        reports: string | null;
    };
}

const ROWS: FilterRow[] = [
    {
        id: "agents",
        label: "All Agents",
        keys: {
            callLogs: "enable_call_log_agent_filter",
            missedCalls: "enable_missed_call_agent_filter",
            reports: "enable_report_agent_filter",
        },
    },
    {
        id: "internal",
        label: "Internal Calls",
        keys: {
            callLogs: "enable_call_log_internal_filter",
            missedCalls: "enable_missed_call_internal_filter",
            reports: "enable_report_internal_filter",
        },
    },
    {
        id: "teams",
        label: "All Teams",
        keys: {
            callLogs: "enable_call_log_team_filter",
            missedCalls: "enable_missed_call_team_filter",
            reports: "enable_report_team_filter",
        },
    },
    {
        id: "classes",
        label: "All Classes",
        keys: {
            callLogs: "enable_call_log_class_filter",
            missedCalls: "enable_missed_call_class_filter",
            reports: "enable_report_class_filter",
        },
    },
    {
        id: "outcomes",
        label: "All Outcomes",
        keys: {
            callLogs: "enable_call_log_outcome_filter",
            missedCalls: null,
            reports: "enable_report_outcome_filter",
        },
    },
    {
        id: "sims",
        label: "SIMs",
        keys: {
            callLogs: "enable_call_log_sim_filter",
            missedCalls: null,
            reports: null,
        },
    },
];

/**
 * Reusable N/A dash marker with pixel-perfect positioning
 */
function NotAvailableMarker() {
    return (
        <div className="flex justify-center items-center h-4 cursor-not-allowed mb-[9px] ml-[16px]" title="Not Applicable">
            <div className="h-4 w-4 shrink-0 rounded-sm bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center pointer-events-none shadow-sm border border-zinc-250 dark:border-zinc-700">
                <Minus className="w-3 text-zinc-500 dark:text-zinc-400 stroke-[4px]" />
            </div>
        </div>
    );
}

export function FilterVisibilityMatrix() {
    const { control } = useFormContext();

    return (
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
            <Table>
                <TableHeader>
                    <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50">
                        <TableHead className="w-[200px] font-bold">Filter</TableHead>
                        <TableHead className="text-center font-bold">Call Logs</TableHead>
                        <TableHead className="text-center font-bold">Missed Call</TableHead>
                        <TableHead className="text-center font-bold">Report</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {ROWS.map((row) => (
                        <TableRow key={row.id}>
                            <TableCell className="font-medium">{row.label}</TableCell>
                            
                            {/* Call Logs Column */}
                            <TableCell className="text-center">
                                {row.keys.callLogs ? (
                                    <FormField
                                        control={control}
                                        name={row.keys.callLogs}
                                        render={({ field }) => (
                                            <FormItem className="flex justify-center">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                ) : (
                                    <NotAvailableMarker />
                                )}
                            </TableCell>

                            {/* Missed Calls Column */}
                            <TableCell className="text-center">
                                {row.keys.missedCalls ? (
                                    <FormField
                                        control={control}
                                        name={row.keys.missedCalls}
                                        render={({ field }) => (
                                            <FormItem className="flex justify-center">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                ) : (
                                    <NotAvailableMarker />
                                )}
                            </TableCell>

                            {/* Reports Column */}
                            <TableCell className="text-center">
                                {row.keys.reports ? (
                                    <FormField
                                        control={control}
                                        name={row.keys.reports}
                                        render={({ field }) => (
                                            <FormItem className="flex justify-center">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                ) : (
                                    <NotAvailableMarker />
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
