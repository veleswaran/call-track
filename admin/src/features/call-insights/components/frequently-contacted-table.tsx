"use client";

import { useState, useMemo } from "react";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shared/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@shared/components/ui/tooltip";
import { FrequentlyContacted, CallInsightsFiltersData } from "../types";
import { FrequentlyContactedDetailsDialog } from "./frequently-contacted-details-dialog";

interface FrequentlyContactedTableProps {
    data: FrequentlyContacted[];
    isLoading?: boolean;
    dateFrom?: string;
    dateTo?: string;
    filters?: CallInsightsFiltersData;
}

function AgentsHandledBadge({ rawAgents }: { rawAgents: string }) {
    const agents = useMemo(() => {
        if (!rawAgents) return [];
        return rawAgents
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    }, [rawAgents]);

    if (agents.length === 0) {
        return <span className="text-muted-foreground text-xs">—</span>;
    }

    if (agents.length === 1) {
        return (
            <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                {agents[0]}
            </span>
        );
    }

    const firstAgent = agents[0];
    const remainingCount = agents.length - 1;

    return (
        <TooltipProvider delayDuration={150}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 text-left text-xs hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors focus:outline-none group cursor-pointer"
                        aria-label={`Agents handled: ${rawAgents}`}
                    >
                        <span className="font-medium text-zinc-800 dark:text-zinc-200 max-w-[90px] sm:max-w-[110px] truncate">
                            {firstAgent}
                        </span>
                        <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 font-semibold shrink-0 border border-zinc-200/80 dark:border-zinc-700"
                        >
                            +{remainingCount} more
                        </Badge>
                    </button>
                </TooltipTrigger>
                <TooltipContent
                    side="top"
                    align="start"
                    className="p-2.5 max-w-xs shadow-lg bg-zinc-900 dark:bg-zinc-950 text-white border border-zinc-800 text-xs z-50"
                >
                    <p className="font-semibold text-zinc-300 text-[11px] mb-1.5 pb-1 border-b border-zinc-800">
                        Agents Handled ({agents.length})
                    </p>
                    <ul className="space-y-1">
                        {agents.map((agentName, idx) => (
                            <li key={idx} className="flex items-center gap-1.5 text-zinc-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                <span>{agentName}</span>
                            </li>
                        ))}
                    </ul>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function AgentContactsVariationsBadge({
    agentContacts,
}: {
    agentContacts?: Array<{ agent_name: string; contact_name: string }>;
}) {
    const grouped = useMemo(() => {
        if (!agentContacts || agentContacts.length === 0) return [];
        const map = new Map<string, { displayName: string; agents: string[] }>();
        for (const ac of agentContacts) {
            const name = ac.contact_name?.trim();
            if (!name) continue;
            const normalizedKey = name.toLowerCase();
            const existing = map.get(normalizedKey);
            if (existing) {
                existing.agents.push(ac.agent_name);
            } else {
                map.set(normalizedKey, { displayName: name, agents: [ac.agent_name] });
            }
        }
        return Array.from(map.values())
            .map(({ displayName, agents }) => ({ contact_name: displayName, agents }))
            .sort((a, b) => b.agents.length - a.agents.length);
    }, [agentContacts]);

    if (grouped.length <= 1) {
        return null;
    }

    return (
        <TooltipProvider delayDuration={150}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className="text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer inline-flex items-center gap-1 mt-0.5 focus:outline-none"
                    >
                        <span>{grouped.length} name variations</span>
                    </button>
                </TooltipTrigger>
                <TooltipContent
                    side="top"
                    align="start"
                    className="p-2.5 max-w-xs shadow-lg bg-zinc-900 dark:bg-zinc-950 text-white border border-zinc-800 text-xs z-50 space-y-2"
                >
                    <div className="font-semibold text-zinc-300 text-[11px] pb-1 border-b border-zinc-800">
                        Saved by Agents (Grouped by Customer Name)
                    </div>
                    <div className="space-y-1.5">
                        {grouped.map((g, idx) => (
                            <div key={idx} className="text-[11px]">
                                <div className="font-semibold text-white flex items-center justify-between">
                                    <span>&quot;{g.contact_name}&quot;</span>
                                    <span className="text-[10px] text-zinc-400 font-normal">
                                        {g.agents.length} {g.agents.length === 1 ? "agent" : "agents"}
                                    </span>
                                </div>
                                <div className="text-[10px] text-zinc-400 truncate" title={g.agents.join(", ")}>
                                    {g.agents.length === 1 ? (
                                        <span>{g.agents[0]}</span>
                                    ) : (
                                        <span>
                                            {g.agents.slice(0, 2).join(", ")}
                                            {g.agents.length > 2 ? ` +${g.agents.length - 2} more` : ""}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export function FrequentlyContactedTable({ data, isLoading, dateFrom, dateTo, filters }: FrequentlyContactedTableProps) {
    const [selectedCustomer, setSelectedCustomer] = useState<FrequentlyContacted | null>(null);

    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/80 gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                            Frequently Contacted Numbers
                        </h2>
                        <span className="text-xs text-muted-foreground font-normal">
                            · Repeated touchpoints directory
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Surfaces phone numbers receiving and generating the highest interaction density across all team devices.
                    </p>
                </div>

                <Badge variant="secondary" className="self-start sm:self-auto bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 px-3 py-1 font-semibold text-xs">
                    High-Touch Accounts
                </Badge>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-zinc-50/70 dark:bg-zinc-900/50">
                        <TableRow className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-transparent">
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 min-w-[150px]">Customer</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Phone Number</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Account Category</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-center">Total Touchpoints</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-center">In / Out Ratio</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Total Talk Time</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 min-w-[150px]">Agents Handled</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Last Contacted</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i} className="animate-pulse border-b border-zinc-100 dark:border-zinc-800">
                                    <TableCell><div className="h-4 w-36 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-10 rounded bg-zinc-200 dark:bg-zinc-800 mx-auto" /></TableCell>
                                    <TableCell><div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800 mx-auto" /></TableCell>
                                    <TableCell><div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-12 rounded bg-zinc-200 dark:bg-zinc-800 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-40 text-center text-sm text-muted-foreground">
                                    No frequent contact data found for the selected filter criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow
                                    key={item.phone_hash}
                                    className="border-b border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                                >
                                    <TableCell className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 min-w-[150px]">
                                        <div>{item.customer_name}</div>
                                        <AgentContactsVariationsBadge agentContacts={item.agent_contacts} />
                                        {/* Mobile view metadata: visible directly on small screens */}
                                        <div className="sm:hidden text-[11px] font-normal text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                                            <span>{item.phone_number}</span>
                                            <span>•</span>
                                            <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                                                {item.agents_handled}
                                            </span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                                        {item.phone_number}
                                    </TableCell>

                                    <TableCell>
                                        <Badge variant="outline" className="text-[11px] font-normal border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/40">
                                            {item.account_category}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="text-center font-bold text-xs text-zinc-900 dark:text-zinc-100">
                                        {item.total_touchpoints}
                                    </TableCell>

                                    <TableCell className="text-center text-xs">
                                        <span className="font-semibold text-blue-600 dark:text-blue-400">{item.in_count} In</span>
                                        <span className="text-muted-foreground mx-1">/</span>
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{item.out_count} Out</span>
                                    </TableCell>

                                    <TableCell className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                                        {item.total_talk_time}
                                    </TableCell>

                                    <TableCell className="text-xs min-w-[150px]">
                                        <AgentsHandledBadge rawAgents={item.agents_handled} />
                                    </TableCell>

                                    <TableCell className="text-xs text-muted-foreground">
                                        {item.last_contacted}
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedCustomer(item)}
                                            className="h-7 px-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/50"
                                        >
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Popup Dialog showing customer details and call history with current filters */}
            <FrequentlyContactedDetailsDialog
                customer={selectedCustomer}
                open={!!selectedCustomer}
                onOpenChange={(open) => {
                    if (!open) setSelectedCustomer(null);
                }}
                filters={filters}
                dateFrom={dateFrom}
                dateTo={dateTo}
            />
        </div>
    );
}
