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
import { cn } from "@shared/utils";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import type { CallLogFilters as FilterTypes } from "../hooks/use-call-logs";
import { useDevices } from "@features/devices/hooks/use-devices";
import { useAgents } from "@features/agents/hooks/use-agents";

interface CallLogFiltersProps {
    filters: FilterTypes;
    onChange: (filters: FilterTypes) => void;
}

export function CallLogFilters({ filters, onChange }: CallLogFiltersProps) {
    const { data: devicesData } = useDevices({ page: 1, per_page: 100 });
    const { data: agentsData } = useAgents({ page: 1, per_page: 100 });

    const devices = devicesData?.data ?? [];
    const agents = agentsData?.data ?? [];

    const hasFilters =
        filters.call_type ||
        filters.classification ||
        filters.date_from ||
        filters.date_to ||
        filters.device_id ||
        filters.agent_id;

    const clearFilters = () => {
        onChange({
            page: 1,
            per_page: filters.per_page,
            search: filters.search,
        });
    };

    const updateFilter = (key: keyof FilterTypes, value: string) => {
        onChange({
            ...filters,
            page: 1, // Reset to page 1 on filter change
            [key]: value === "all" ? undefined : value,
        });
    };

    const updateNumericFilter = (key: keyof FilterTypes, value: string) => {
        onChange({
            ...filters,
            page: 1,
            [key]: value === "all" ? undefined : parseInt(value),
        });
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Select
                value={filters.device_id?.toString() ?? "all"}
                onValueChange={(val) => updateNumericFilter("device_id", val)}
            >
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Device" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Devices</SelectItem>
                    {devices.map((device) => (
                        <SelectItem key={device.id} value={device.id.toString()}>
                            {device.device_name || device.device_model || `Device ${device.id}`}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={filters.agent_id?.toString() ?? "all"}
                onValueChange={(val) => updateNumericFilter("agent_id", val)}
            >
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Agent" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id.toString()}>
                            {agent.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={filters.call_type ?? "all"}
                onValueChange={(val) => updateFilter("call_type", val)}
            >
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Call Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="incoming">Incoming</SelectItem>
                    <SelectItem value="outgoing">Outgoing</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                </SelectContent>
            </Select>

            <Select
                value={filters.classification ?? "all"}
                onValueChange={(val) => updateFilter("classification", val)}
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

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-[240px] justify-start text-left font-normal",
                            !filters.date_from && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.date_from ? (
                            filters.date_to ? (
                                <>
                                    {format(new Date(filters.date_from), "LLL dd, y")} -{" "}
                                    {format(new Date(filters.date_to), "LLL dd, y")}
                                </>
                            ) : (
                                format(new Date(filters.date_from), "LLL dd, y")
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
                        defaultMonth={filters.date_from ? new Date(filters.date_from) : undefined}
                        selected={{
                            from: filters.date_from ? new Date(filters.date_from) : undefined,
                            to: filters.date_to ? new Date(filters.date_to) : undefined,
                        }}
                        onSelect={(range) => {
                            onChange({
                                ...filters,
                                page: 1,
                                date_from: range?.from?.toISOString(),
                                date_to: range?.to?.toISOString(),
                            });
                        }}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>

            {hasFilters && (
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
