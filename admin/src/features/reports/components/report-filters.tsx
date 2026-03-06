"use client"

import { useState } from "react"
import { CalendarIcon, Filter, X } from "lucide-react"
import { format } from "date-fns"
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

export interface ReportFiltersData {
    dateRange: DateRange | undefined
    outcome: string
    type: string
}

interface ReportFiltersProps {
    onFilterChange: (filters: ReportFiltersData) => void
}

export function ReportFilters({ onFilterChange }: ReportFiltersProps) {
    // Default: Last 7 days
    const defaultDateRange = {
        from: new Date(new Date().setDate(new Date().getDate() - 7)),
        to: new Date(),
    };

    const [date, setDate] = useState<DateRange | undefined>(defaultDateRange)
    const [outcome, setOutcome] = useState("all")
    const [type, setType] = useState("BUSINESS")

    const handleApplyFilters = () => {
        onFilterChange({ dateRange: date, outcome, type })
    }

    const clearFilters = () => {
        // Reset to defaults
        setDate(defaultDateRange);
        setOutcome("all");
        setType("BUSINESS");
        onFilterChange({ dateRange: defaultDateRange, outcome: "all", type: "BUSINESS" });
    }

    return (
        <div className="flex flex-wrap items-center gap-3 p-4 border rounded-lg bg-card shadow-sm">
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
                            date.to ? (
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
                        onSelect={setDate}
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
                    <SelectItem value="CONNECTED">Connected</SelectItem>
                    <SelectItem value="MISSED">Missed</SelectItem>
                    <SelectItem value="NO_ANSWER">No Answer</SelectItem>
                </SelectContent>
            </Select>

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
