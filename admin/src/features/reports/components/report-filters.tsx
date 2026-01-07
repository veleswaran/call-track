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
    status: string
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
    const [status, setStatus] = useState("all")
    const [type, setType] = useState("BUSINESS")

    const handleApplyFilters = () => {
        onFilterChange({ dateRange: date, status, type })
    }

    const clearFilters = () => {
        // Reset to defaults
        setDate(defaultDateRange);
        setStatus("all");
        setType("BUSINESS");
        onFilterChange({ dateRange: defaultDateRange, status: "all", type: "BUSINESS" });
    }

    return (
        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

                {/* Date Range Picker */}
                <div className={cn("grid gap-2")}>
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
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "LLL dd, y")} -{" "}
                                            {format(date.to, "LLL dd, y")}
                                        </>
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
                </div>

                {/* Filters Row */}
                <div className="flex flex-1 gap-2 items-center w-full md:w-auto justify-end">

                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="CONNECTED">Connected</SelectItem>
                            <SelectItem value="MISSED">Missed</SelectItem>
                            <SelectItem value="NO_ANSWER">No Answer</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger className="w-[140px]">
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
                        className="ml-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                    </Button>
                </div>
            </div>
        </div>
    )
}
