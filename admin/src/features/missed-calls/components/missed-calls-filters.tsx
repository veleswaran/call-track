"use client";

import { useState } from "react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { CalendarIcon, Filter, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@shared/utils";
import { Button } from "@shared/components/ui/button";
import { Calendar } from "@shared/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@shared/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@shared/components/ui/select";
import { api } from "@shared/api/api";
import { Agent, Team, PaginatedResponse } from "@shared/types";
import { EscalationStatus, GetEscalationsParams } from "../types/escalation";

interface MissedCallsFiltersProps {
    onFilterChange: (filters: Partial<GetEscalationsParams>) => void;
}

export function MissedCallsFilters({ onFilterChange }: MissedCallsFiltersProps) {
    const defaultDateRange: DateRange = {
        from: new Date(),
        to: new Date(),
    };

    const [date, setDate] = useState<DateRange | undefined>(defaultDateRange);
    const [status, setStatus] = useState<string>("all");
    const [agentId, setAgentId] = useState<string>("all");
    const [teamId, setTeamId] = useState<string>("all");
    const [quickDate, setQuickDate] = useState<string>("today");

    // Fetch Agents for filters
    const agentsQuery = useQuery({
        queryKey: ['agents', 'simple-list'],
        queryFn: async () => {
            const res = await api.get<PaginatedResponse<Agent>>('/api/v1/admin/agents?per_page=1000');
            return res.data;
        }
    });

    // Fetch Teams for filters
    const teamsQuery = useQuery({
        queryKey: ['teams', 'simple-list'],
        queryFn: async () => {
            const res = await api.get<PaginatedResponse<Team>>('/api/v1/admin/teams?per_page=1000');
            return res.data;
        }
    });

    const handleQuickDateChange = (value: string) => {
        setQuickDate(value);
        const today = new Date();
        let newRange: DateRange | undefined = undefined;

        switch (value) {
            case "today":
                newRange = { from: today, to: today };
                break;
            case "yesterday":
                const yesterday = subDays(today, 1);
                newRange = { from: yesterday, to: yesterday };
                break;
            case "this_week":
                newRange = { from: startOfWeek(today), to: endOfWeek(today) };
                break;
            case "this_month":
                newRange = { from: startOfMonth(today), to: endOfMonth(today) };
                break;
            case "last_7_days":
                newRange = { from: subDays(today, 7), to: today };
                break;
            case "last_30_days":
                newRange = { from: subDays(today, 30), to: today };
                break;
            case "custom":
                return;
            default:
                newRange = defaultDateRange;
        }

        if (newRange) {
            setDate(newRange);
        }
    };

    const handleApplyFilters = () => {
        onFilterChange({
            status: status === "all" ? null : status as EscalationStatus,
            agent_id: agentId === "all" ? null : agentId,
            team_id: teamId === "all" ? null : teamId,
            date_from: date?.from ? format(date.from, "yyyy-MM-dd") : null,
            date_to: date?.to ? format(date.to, "yyyy-MM-dd") : null,
        });
    };

    const handleReset = () => {
        setStatus("all");
        setAgentId("all");
        setTeamId("all");
        setDate(defaultDateRange);
        setQuickDate("today");
        onFilterChange({
            status: "all",
            agent_id: null,
            team_id: null,
            date_from: format(defaultDateRange.from!, "yyyy-MM-dd"),
            date_to: format(defaultDateRange.to!, "yyyy-MM-dd"),
        });
    };

    return (
        <div className="flex flex-wrap items-center gap-3 p-4 border rounded-lg bg-card shadow-sm">
            {/* Quick Date Select */}
            <Select value={quickDate} onValueChange={handleQuickDateChange}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="this_week">This Week</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                    <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
            </Select>

            {/* Date Range Picker */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[260px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        {date?.from ? (
                            date.to && !isSameDay(date.from, date.to) ? (
                                <span className="truncate">
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </span>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={(newDate) => {
                            setDate(newDate);
                            setQuickDate("custom");
                        }}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>

            <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="unattended">Unattended</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
            </Select>

            <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teamsQuery.data?.map((team: Team) => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={agentId} onValueChange={setAgentId}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Agents" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {agentsQuery.data?.map((agent: Agent) => (
                        <SelectItem key={agent.id} value={agent.id.toString()}>
                            {agent.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Button size="icon" variant="ghost" onClick={handleReset} title="Reset Filters">
                <X className="h-4 w-4" />
            </Button>

            <Button
                onClick={handleApplyFilters}
                className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
                <Filter className="mr-2 h-4 w-4" />
                Filter
            </Button>
        </div>
    );
}
