"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shared/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Button } from "@shared/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@shared/components/ui/select";
import { Users, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { AgentEscalationSummary } from "../types/escalation";

interface MissedCallsAgentSummaryProps {
    agentSummary?: AgentEscalationSummary[];
    isLoading?: boolean;
}

export function MissedCallsAgentSummary({ agentSummary, isLoading }: MissedCallsAgentSummaryProps) {
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const total = agentSummary?.length ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(page, totalPages);
    const startIdx = (safePage - 1) * perPage;
    const pageRows = agentSummary?.slice(startIdx, startIdx + perPage) ?? [];

    const handlePerPageChange = (value: string) => {
        setPerPage(Number(value));
        setPage(1);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base font-semibold">Missed Calls by Agent</CardTitle>
                <Users className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Agent</TableHead>
                                <TableHead className="text-right">Total Missed</TableHead>
                                <TableHead className="text-right">Pending</TableHead>
                                <TableHead className="text-right">Unattended</TableHead>
                                <TableHead className="text-right">Resolved</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: perPage }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 5 }).map((_, j) => (
                                            <TableCell key={j}>
                                                <div className="h-4 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : pageRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-zinc-500 py-6">
                                        No data for the selected filters
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pageRows.map((row) => (
                                    <TableRow key={row.agent_id}>
                                        <TableCell className="font-medium">{row.agent_name}</TableCell>
                                        <TableCell className="text-right font-bold">{row.total_missed}</TableCell>
                                        <TableCell className="text-right text-amber-600 dark:text-amber-400">{row.pending}</TableCell>
                                        <TableCell className="text-right text-red-600 dark:text-red-400">{row.unattended}</TableCell>
                                        <TableCell className="text-right text-emerald-600 dark:text-emerald-400">{row.resolved}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {!isLoading && total > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
                        <p className="text-sm text-muted-foreground">
                            Showing {startIdx + 1} to {Math.min(startIdx + perPage, total)} of {total} agents
                        </p>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Rows per page</span>
                                <Select value={`${perPage}`} onValueChange={handlePerPageChange}>
                                    <SelectTrigger className="h-8 w-[70px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {[5, 10, 25, 50].map((n) => (
                                            <SelectItem key={n} value={`${n}`}>{n}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <span className="text-sm font-medium">
                                Page {safePage} of {totalPages}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" className="h-8 w-8 p-0 hidden lg:flex" onClick={() => setPage(1)} disabled={safePage === 1}>
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setPage(safePage - 1)} disabled={safePage === 1}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setPage(safePage + 1)} disabled={safePage >= totalPages}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" className="h-8 w-8 p-0 hidden lg:flex" onClick={() => setPage(totalPages)} disabled={safePage >= totalPages}>
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
