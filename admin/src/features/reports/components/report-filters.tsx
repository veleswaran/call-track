"use client"

import { useState } from "react"
import { CalendarIcon, Filter, X } from "lucide-react"
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@shared/utils"
import { Button } from "@shared/components/ui/button"
import { Calendar } from "@shared/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@shared/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@shared/components/ui/select"


import { api } from "@shared/api/api"
import { Agent, Team, PaginatedResponse } from "@shared/types"
import { AsyncSelect } from "@shared/components/async-select"
import { useSettingsQuery } from "@features/settings/hooks/use-settings"

export interface ReportFiltersData {
    dateRange: DateRange | undefined
    outcome: string
    type: string
    agentIds?: string[] | null
    teamIds?: string[] | null
    contactFilter?: "all" | "internal" | "external" | null
}

interface ReportFiltersProps {
    onFilterChange: (filters: ReportFiltersData) => void
}

export function ReportFilters({ onFilterChange }: ReportFiltersProps) {
    // Default: Today and BUSINESS as per requirements
    const defaultDateRange = {
        from: new Date(),
        to: new Date(),
    };

    const [date, setDate] = useState<DateRange | undefined>(defaultDateRange)
    const [outcome, setOutcome] = useState("all")
    const [type, setType] = useState("BUSINESS")
    const [agentId, setAgentId] = useState<string>("")
    const [teamId, setTeamId] = useState<string>("all")
    const [contactFilter, setContactFilter] = useState<string>("all")
    const [quickDate, setQuickDate] = useState<string>("today")
    const { data: settings } = useSettingsQuery()
    const handleQuickDateChange = (value: string) => {
        setQuickDate(value)
        const today = new Date()
        let newRange: DateRange | undefined = undefined

        switch (value) {
            case "today":
                newRange = { from: today, to: today }
                break
            case "yesterday":
                const yesterday = subDays(today, 1)
                newRange = { from: yesterday, to: yesterday }
                break
            case "this_week":
                newRange = { from: startOfWeek(today), to: endOfWeek(today) }
                break
            case "this_month":
                newRange = { from: startOfMonth(today), to: endOfMonth(today) }
                break
            case "last_7_days":
                newRange = { from: subDays(today, 7), to: today }
                break
            case "last_30_days":
                newRange = { from: subDays(today, 30), to: today }
                break
            case "custom":
                return
            default:
                newRange = defaultDateRange
        }

        if (newRange) {
            setDate(newRange)
        }
    }



    const handleApplyFilters = () => {
        onFilterChange({
            dateRange: date,
            outcome,
            type,
            agentIds: agentId && agentId !== "all" ? [agentId] : null,
            teamIds: teamId !== "all" ? [teamId] : null,
            contactFilter: contactFilter === "all" ? null : contactFilter as any
        })
    }

    const clearFilters = () => {
        setDate(defaultDateRange);
        setQuickDate("today");
        setOutcome("all");
        setType("BUSINESS");
        setAgentId("");
        setTeamId("all");
        setContactFilter("all");
        onFilterChange({
            dateRange: defaultDateRange,
            outcome: "all",
            type: "BUSINESS",
            agentIds: null,
            teamIds: null,
            contactFilter: null
        });
    }

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
                            setDate(newDate)
                            setQuickDate("custom")
                        }}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>

            <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Outcomes" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Outcomes</SelectItem>
                    <SelectItem value="Connected">Connected</SelectItem>
                    <SelectItem value="Missed">Missed</SelectItem>
                    <SelectItem value="No Answer">No Answer</SelectItem>
                </SelectContent>
            </Select>

            <AsyncSelect
                value={teamId}
                onChange={setTeamId}
                loadOptions={async (search) => {
                    const res = await api.get<PaginatedResponse<Team>>(`/api/v1/admin/teams?search=${search}&per_page=100`)
                    const options = res.data.map((team: Team) => ({
                        label: team.name,
                        value: team.id.toString()
                    }))
                    return [{ label: "All Teams", value: "all" }, ...options]
                }}
                placeholder="All Teams"
                label="Team"
                className="w-[180px]"
            />

            <AsyncSelect
                value={agentId}
                onChange={setAgentId}
                loadOptions={async (search) => {
                    const res = await api.get<PaginatedResponse<Agent>>(`/api/v1/admin/agents?search=${search}&per_page=100&sort_by=name`)
                    const options = res.data.map((agent: Agent) => ({
                        label: agent.name,
                        value: agent.id.toString()
                    }))
                    return [{ label: "All Agents", value: "all" }, ...options]
                }}
                placeholder="All Agents"
                label="Agent"
                className="w-[180px]"
            />

            <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    <SelectItem value="BUSINESS">Business</SelectItem>
                    <SelectItem value="PERSONAL">Personal</SelectItem>
                    <SelectItem value="IGNORED">Ignored</SelectItem>
                </SelectContent>
            </Select>

            {settings?.enable_report_internal_filter && (
                <Select value={contactFilter} onValueChange={setContactFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="All Records" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Records</SelectItem>
                        <SelectItem value="internal">Include Internal</SelectItem>
                        <SelectItem value="external">Exclude Internal</SelectItem>
                    </SelectContent>
                </Select>
            )}

            <Button size="icon" variant="ghost" onClick={clearFilters} title="Reset Filters">
                <X className="h-4 w-4" />
            </Button>

            <Button
                onClick={handleApplyFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white"
            >
                <Filter className="mr-2 h-4 w-4" />
                Filter
            </Button>
        </div>
    )
}
