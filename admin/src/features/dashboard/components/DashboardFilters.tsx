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

export interface DashboardFiltersData {
    dateRange: DateRange | undefined
}

interface DashboardFiltersProps {
    onFilterChange: (filters: DashboardFiltersData) => void
}

export function DashboardFilters({ onFilterChange }: DashboardFiltersProps) {
    const defaultDateRange = {
        from: startOfWeek(new Date()),
        to: endOfWeek(new Date()),
    };

    const [date, setDate] = useState<DateRange | undefined>(defaultDateRange)
    const [quickDate, setQuickDate] = useState<string>("this_week")

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
        })
    }

    const clearFilters = () => {
        setDate(defaultDateRange);
        setQuickDate("this_week");
        onFilterChange({
            dateRange: defaultDateRange,
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

            <Button size="icon" variant="ghost" onClick={clearFilters} title="Reset">
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
