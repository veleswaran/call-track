"use client";

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
import { AsyncSelect } from "@shared/components/async-select";
import { cn } from "@shared/utils";
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import type { CallLogFilters as FilterTypes } from "../hooks/use-call-logs";
import { api } from "@shared/api/api";
import type { Agent } from "@shared/types";
import { useAuth } from "@features/auth/hooks/use-auth";
import { useSettingsQuery } from "@features/settings/hooks/use-settings";

interface CallLogFiltersProps {
    filters: FilterTypes;
    onChange: (filters: FilterTypes) => void;
}

export function CallLogFilters({ filters, onChange }: CallLogFiltersProps) {
    const { user } = useAuth();
    const { data: settings } = useSettingsQuery();

    // Allow if user is admin or can manage team
    const canViewTeams = user?.roles?.includes('admin') || user?.roles?.includes('super-admin') || user?.permissions?.includes('manage team');

    const hasActiveFilters =
        filters.start_date ||
        filters.end_date ||
        filters.sim_slot !== undefined ||
        (filters.agents && filters.agents.length > 0) ||
        (filters.types && filters.types.length > 0) ||
        (filters.outcomes && filters.outcomes.length > 0) ||
        (filters.classifications && filters.classifications.length > 0) ||
        filters.team_id ||
        filters.contact_filter;

    const clearFilters = () => {
        onChange({
            page: 1,
            per_page: filters.per_page,
            search: filters.search,
        });
    };

    const updateNumericFilter = (key: keyof FilterTypes, value: string) => {
        onChange({
            ...filters,
            page: 1,
            [key]: value === "all" ? undefined : parseInt(value),
        });
    };

    // Helper for single-select dropdowns that map to array filters
    const updateArrayFilter = (key: 'types' | 'classifications' | 'outcomes', value: string) => {
        onChange({
            ...filters,
            page: 1,
            [key]: value === "all" ? undefined : [value],
        });
    };

    const updateAgentFilter = (value: string | undefined) => {
        onChange({
            ...filters,
            page: 1,
            agents: value && value !== "all" ? [parseInt(value)] : undefined,
        });
    };

    const handleQuickDateChange = (preset: string) => {
        const today = new Date();
        let start: Date | undefined;
        let end: Date | undefined = endOfDay(today);

        switch (preset) {
            case "today":
                start = startOfDay(today);
                break;
            case "yesterday":
                start = startOfDay(subDays(today, 1));
                end = endOfDay(subDays(today, 1));
                break;
            case "last7":
                start = startOfDay(subDays(today, 6)); // Last 7 days including today
                break;
            case "last30":
                start = startOfDay(subDays(today, 29));
                break;
            case "thisMonth":
                start = startOfMonth(today);
                break;
            case "lastMonth":
                start = startOfMonth(subMonths(today, 1));
                end = endOfMonth(subMonths(today, 1));
                break;
            case "all":
            default:
                start = undefined;
                end = undefined;
                break;
        }

        onChange({
            ...filters,
            page: 1,
            start_date: start ? format(start, 'yyyy-MM-dd') : undefined,
            end_date: end ? format(end, 'yyyy-MM-dd') : undefined,
        });
    };

    const loadAgents = async (search: string) => {
        try {
            const response = await api.get<{ data: Agent[] }>(
                `/api/v1/admin/agents?page=1&per_page=20&search=${encodeURIComponent(search)}&sort_by=name`
            );
            const options = response.data.map((u: Agent) => ({
                label: u.name,
                value: u.id.toString(),
            }));
            return [{ label: "All Agents", value: "all" }, ...options];
        } catch (e) {
            console.error(e);
            return [];
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Agent Filter - Only for Admins/Managers and if enabled in settings */}
            {canViewTeams && settings?.enable_call_log_agent_filter && (
                <AsyncSelect
                    label="Agent"
                    placeholder="All Agents"
                    value={filters.agents?.[0]?.toString()}
                    onChange={updateAgentFilter}
                    loadOptions={loadAgents}
                    className="w-[160px]"
                />
            )}

            <Select
                value={filters.types?.[0] ?? "all"}
                onValueChange={(val) => updateArrayFilter("types", val)}
            >
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Call Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="incoming">Incoming</SelectItem>
                    <SelectItem value="outgoing">Outgoing</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
            </Select>

            {/* Team Filter - Only for Admins/Managers and if enabled in settings */}
            {canViewTeams && settings?.enable_call_log_team_filter && (
                <AsyncSelect
                    label="Team"
                    placeholder="Team..."
                    value={filters.team_id?.toString()}
                    onChange={(val) => updateNumericFilter("team_id", val)}
                    loadOptions={async () => {
                        try {
                            // Dynamically import to avoid circular dependencies if any, though likely fine
                            const { teamsApi } = await import("@features/teams/api/teams-api");
                            const response = await teamsApi.getTeams({
                                page: 1,
                                per_page: 20,
                            });
                            return response.data.map((t) => ({
                                label: t.name,
                                value: t.id.toString(),
                            }));
                        } catch (e) {
                            console.error(e);
                            return [];
                        }
                    }}
                    className="w-[160px]"
                />
            )}

            {settings?.enable_call_log_outcome_filter && (
                <Select
                    value={filters.outcomes?.[0] ?? "all"}
                    onValueChange={(val) => updateArrayFilter("outcomes", val)}
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Call Outcome" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Outcomes</SelectItem>
                        <SelectItem value="Connected">Connected</SelectItem>
                        <SelectItem value="Missed">Missed</SelectItem>
                        <SelectItem value="No Answer">No Answer</SelectItem>
                    </SelectContent>
                </Select>
            )}

            {settings?.enable_call_log_class_filter && (
                <Select
                    value={filters.classifications?.[0] ?? "all"}
                    onValueChange={(val) => updateArrayFilter("classifications", val)}
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Classification" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="ignored">Ignored</SelectItem>
                    </SelectContent>
                </Select>
            )}

            {settings?.enable_call_log_sim_filter && (
                <Select
                    value={filters.sim_slot?.toString() ?? "all"}
                    onValueChange={(val) => updateNumericFilter("sim_slot", val)}
                >
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="SIM Slot" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All SIMs</SelectItem>
                        <SelectItem value="0">SIM 1</SelectItem>
                        <SelectItem value="1">SIM 2</SelectItem>
                    </SelectContent>
                </Select>
            )}

            {settings?.enable_call_log_internal_filter && (
                <Select
                    value={filters.contact_filter ?? "all"}
                    onValueChange={(val) => onChange({ ...filters, page: 1, contact_filter: val as "internal" | "external" })}
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Contact Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Records</SelectItem>
                        <SelectItem value="internal">Include Internal</SelectItem>
                        <SelectItem value="external">Exclude Internal</SelectItem>
                    </SelectContent>
                </Select>
            )}

            <Select onValueChange={handleQuickDateChange}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="last7">Last 7 Days</SelectItem>
                    <SelectItem value="last30">Last 30 Days</SelectItem>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                </SelectContent>
            </Select>

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-[240px] justify-start text-left font-normal",
                            !filters.start_date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.start_date ? (
                            filters.end_date ? (
                                <>
                                    {format(new Date(filters.start_date), "LLL dd, y")} -{" "}
                                    {format(new Date(filters.end_date), "LLL dd, y")}
                                </>
                            ) : (
                                format(new Date(filters.start_date), "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={filters.start_date ? new Date(filters.start_date) : undefined}
                        selected={{
                            from: filters.start_date ? new Date(filters.start_date) : undefined,
                            to: filters.end_date ? new Date(filters.end_date) : undefined,
                        }}
                        onSelect={(range) => {
                            onChange({
                                ...filters,
                                page: 1,
                                start_date: range?.from ? format(range.from, 'yyyy-MM-dd') : undefined,
                                end_date: range?.to ? format(range.to, 'yyyy-MM-dd') : undefined,
                            });
                        }}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>

            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="h-8 px-2 lg:px-3"
                >
                    Reset
                    <X className="ml-2 h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
