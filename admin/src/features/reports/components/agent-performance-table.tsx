"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shared/components/ui/table"
import { Badge } from "@shared/components/ui/badge"
import { Button } from "@shared/components/ui/button"
import { Info, ArrowUpDown } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@shared/components/ui/tooltip"
import { useState } from "react"
import Link from "next/link";
import { format } from "date-fns";
import { ReportFiltersData } from "./report-filters";

export interface AgentPerformance {
    id: number
    agent: string
    employee_code: string
    first_call_time: string
    total_calls: number
    connected: number
    missed: number
    avg_duration: string
    total_duration: string
    handling_rate: number
    performance: 'Excellent' | 'Good' | 'Average' | 'Poor'
}

interface AgentPerformanceTableProps {
    data: AgentPerformance[]
    filters: ReportFiltersData
    sortBy?: string | null
    sortOrder?: 'asc' | 'desc'
    onSort?: (key: string, order: 'asc' | 'desc') => void
}

const getPerformanceColor = (perf: string) => {
    switch (perf) {
        case 'Excellent': return 'bg-green-100 text-green-700 hover:bg-green-100';
        case 'Good': return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
        case 'Average': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100';
        case 'Poor': return 'bg-red-100 text-red-700 hover:bg-red-100';
        default: return 'bg-gray-100 text-gray-700';
    }
}

/**
 * Helper to parse duration string (e.g. "1h 30m" or "45s") to seconds for sorting
 */
const durationToSeconds = (duration: string): number => {
    if (!duration) return 0;

    let totalSeconds = 0;
    const parts = duration.split(' ');

    parts.forEach(part => {
        if (part.endsWith('h')) {
            totalSeconds += parseInt(part) * 3600;
        } else if (part.endsWith('m')) {
            totalSeconds += parseInt(part) * 60;
        } else if (part.endsWith('s')) {
            totalSeconds += parseInt(part);
        }
    });

    return totalSeconds;
}

/**
 * Helper to parse time string (e.g. "09:15 AM") to minutes from midnight for sorting
 */
const timeToMinutes = (timeStr: string): number => {
    if (!timeStr || timeStr === 'N/A') return Infinity;

    const [time, period] = timeStr.split(' ');
    if (!time || !period) return Infinity;

    const timeParts = time.split(':').map(Number);
    let hours = timeParts[0];
    const minutes = timeParts[1];
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return hours * 60 + minutes;
}

const SortableHeader = ({
    label,
    sortKey,
    onSort,
    align = "left",
    className = ""
}: {
    label: React.ReactNode,
    sortKey: keyof AgentPerformance,
    onSort: (key: keyof AgentPerformance) => void,
    align?: "left" | "right" | "center",
    className?: string
}) => (
    <TableHead className={className}>
        <Button
            variant="ghost"
            onClick={() => onSort(sortKey)}
            className={`p-0 hover:bg-transparent flex items-center gap-1 ${align === "right" ? "ml-auto" : align === "center" ? "mx-auto" : ""}`}
        >
            {label}
            <ArrowUpDown className="h-3 w-3" />
        </Button>
    </TableHead>
);

export function AgentPerformanceTable({
    data,
    filters,
    sortBy,
    sortOrder,
    onSort,
}: AgentPerformanceTableProps) {
    const [sortConfig, setSortConfig] = useState<{
        key: keyof AgentPerformance | null;
        direction: 'asc' | 'desc';
    }>({ key: null, direction: 'asc' });

    const handleSort = (key: keyof AgentPerformance) => {
        if (onSort) {
            const nextOrder = (sortBy === key && sortOrder === 'asc') ? 'desc' : 'asc';
            onSort(key as string, nextOrder);
        } else {
            let direction: 'asc' | 'desc' = 'asc';
            if (sortConfig.key === key && sortConfig.direction === 'asc') {
                direction = 'desc';
            }
            setSortConfig({ key, direction });
        }
    };

    const sortedData = onSort ? data : [...data].sort((a, b) => {
        if (!sortConfig.key) return 0;

        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle duration sorting
        if (sortConfig.key === 'total_duration' || sortConfig.key === 'avg_duration') {
            aValue = durationToSeconds(aValue as string);
            bValue = durationToSeconds(bValue as string);
        }

        // Handle time sorting
        if (sortConfig.key === 'first_call_time') {
            aValue = timeToMinutes(aValue as string);
            bValue = timeToMinutes(bValue as string);
        }

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });



    // Helper to build call logs URL
    const getCallLogsUrl = (agentId: number) => {
        const params = new URLSearchParams();

        // Agent Filter
        params.append('agents[]', String(agentId));

        // Date Range
        if (filters.dateRange?.from) {
            params.append('start_date', format(filters.dateRange.from, 'yyyy-MM-dd'));
        }
        if (filters.dateRange?.to) {
            params.append('end_date', format(filters.dateRange.to, 'yyyy-MM-dd'));
        }

        // Classification (mapped from 'type' filter in ReportFilters)
        if (filters.type && filters.type !== 'BUSINESS') {
            // Frontend 'type' filter values are BUSINESS, PERSONAL, IGNORED which match backend classification
            // Backend expects lowercase for simple match or validation allows string. 
            // Request validation: in:business,personal,ignored
            // Frontend sends: BUSINESS (uppercase).
            // Backend validation in:business,personal,ignored is case sensitive usually.
            // Let's send lowercase.
            params.append('classifications[]', filters.type.toLowerCase());
        }

        // Outcome
        if (filters.outcome && filters.outcome !== 'all') {
            params.append('outcomes[]', filters.outcome);
        }

        // Team Filter
        if (filters.teamIds && filters.teamIds.length > 0) {
            filters.teamIds.forEach(id => params.append('team_ids[]', id));
        }

        return `/call-logs?${params.toString()}`;
    };

    return (
        <div className="rounded-md border">
            <TooltipProvider>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Avatar</TableHead>
                            <SortableHeader label="Agent" sortKey="agent" onSort={handleSort} />
                            <TableHead>EMP Code</TableHead>
                            <SortableHeader label="First Call" sortKey="first_call_time" align="center" className="text-center" onSort={handleSort} />
                            <SortableHeader label="Total Calls" sortKey="total_calls" align="right" className="text-right" onSort={handleSort} />
                            <SortableHeader label="Connected" sortKey="connected" align="right" className="text-right" onSort={handleSort} />
                            <SortableHeader label="Missed" sortKey="missed" align="right" className="text-right" onSort={handleSort} />
                            <SortableHeader label="Total Duration" sortKey="total_duration" onSort={handleSort} />
                            <SortableHeader label="Avg Duration" sortKey="avg_duration" onSort={handleSort} />
                            <TableHead>
                                <div className="flex items-center gap-1">
                                    Handling Rate
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="h-3 w-3 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>(Connected / Total) * 100%</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </TableHead>
                            <TableHead>
                                <div className="flex items-center gap-1">
                                    Performance
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="h-3 w-3 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Excellent: ≥ 80%</p>
                                            <p>Average: 40-79%</p>
                                            <p>Poor: &lt; 40%</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedData.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell>
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${row.id % 2 === 0 ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                                        }`}>
                                        {row.agent.substring(0, 2).toUpperCase()}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">{row.agent}</TableCell>
                                <TableCell>{row.employee_code}</TableCell>
                                <TableCell className={`text-center ${row.first_call_time === 'N/A' ? 'text-muted-foreground' : ''}`}>
                                    {row.first_call_time}
                                </TableCell>
                                <TableCell className="text-right">{row.total_calls}</TableCell>
                                <TableCell className="text-right text-green-600 font-bold">{row.connected}</TableCell>
                                <TableCell className="text-right text-red-600 font-bold">{row.missed}</TableCell>
                                <TableCell>{row.total_duration}</TableCell>
                                <TableCell>{row.avg_duration}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm">{row.handling_rate}%</span>
                                        <div className="h-2 w-16 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${row.handling_rate > 80 ? 'bg-green-500' : (row.handling_rate > 50 ? 'bg-blue-500' : 'bg-red-500')}`} style={{ width: `${row.handling_rate}%` }} />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`border-0 ${getPerformanceColor(row.performance)}`}>
                                        {row.performance}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Link
                                        href={getCallLogsUrl(row.id)}
                                        className="text-sm font-medium text-primary hover:underline"
                                    >
                                        View Calls
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                        {data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                    No agent performance data available for this period.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TooltipProvider>
        </div>
    )
}
