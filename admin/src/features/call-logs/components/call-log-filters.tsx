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
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import type { CallLogFilters as FilterTypes } from "../hooks/use-call-logs";
import { api } from "@shared/api/api";
import type { PaginatedResponse, Device } from "@shared/types";
import { useAuth } from "@features/auth/hooks/use-auth";

interface CallLogFiltersProps {
    filters: FilterTypes;
    onChange: (filters: FilterTypes) => void;
}

export function CallLogFilters({ filters, onChange }: CallLogFiltersProps) {
    const { user } = useAuth();
    // Allow if user is admin or can manage team
    const canViewTeams = user?.roles?.includes('admin') || user?.roles?.includes('super-admin') || user?.permissions?.includes('manage team');

    const hasActiveFilters =
        filters.start_date ||
        filters.end_date ||
        filters.device_id ||
<<<<<<< feature/teams
=======
        filters.sim_slot !== undefined ||
        (filters.agents && filters.agents.length > 0) ||
>>>>>>> develop
        (filters.types && filters.types.length > 0) ||
        (filters.statuses && filters.statuses.length > 0) ||
        (filters.classifications && filters.classifications.length > 0) ||
        filters.team_id;

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
    const updateArrayFilter = (key: 'types' | 'classifications' | 'statuses', value: string) => {
        onChange({
            ...filters,
            page: 1,
            [key]: value === "all" ? undefined : [value],
        });
    };

    // Load functions for AsyncSelect
    const loadDevices = async (search: string) => {
        try {
            const response = await api.get<PaginatedResponse<Device>>(
                `/api/v1/admin/devices?page=1&per_page=20&search=${encodeURIComponent(search)}`
            );
            return response.data.map((d) => ({
                label: d.device_name || d.device_model || `Device ${d.id}`,
                value: d.id.toString(),
            }));
        } catch (e) {
            console.error(e);
            return [];
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <AsyncSelect
                label="Device"
                placeholder="Device..."
                value={filters.device_id?.toString()}
                onChange={(val) => updateNumericFilter("device_id", val)}
                loadOptions={loadDevices}
                className="w-[160px]"
            />

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

            {/* Team Filter - Only for Admins/Managers */}
            {canViewTeams && (
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

            <Select
                value={filters.statuses?.[0] ?? "all"}
                onValueChange={(val) => updateArrayFilter("statuses", val)}
            >
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Connected">Connected</SelectItem>
                    <SelectItem value="Missed">Missed</SelectItem>
                    <SelectItem value="No Answer">No Answer</SelectItem>
                </SelectContent>
            </Select>

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
                                start_date: range?.from?.toISOString(),
                                end_date: range?.to?.toISOString(),
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
