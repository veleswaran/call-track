"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, Info } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { Badge } from "@shared/components/ui/badge"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@shared/components/ui/tooltip"
import { cn } from "@shared/utils"

/**
 * Timezone-safe date parser for 'YYYY-MM-DD' strings to prevent date-shifting
 */
const safeParseDate = (dateStr: string): Date => {
    const parts = dateStr.split('-')
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1 // 0-indexed in JS
        const day = parseInt(parts[2], 10)
        return new Date(year, month, day)
    }
    return new Date(dateStr)
}

export interface DayWiseDailyStats {
    total_calls: number
    connected: number
    missed: number
    total_duration: string
    total_duration_seconds: number
    first_call_time: string | null
}

export interface DayWiseAgent {
    agent_id: number
    agent_name: string
    employee_code: string
    daily_stats: Record<string, DayWiseDailyStats>
    period_total: {
        total_calls: number
        connected: number
        missed: number
        total_duration: string
        total_duration_seconds: number
    }
}

export interface DayWiseReportData {
    agents: DayWiseAgent[]
    dates: string[]
    meta: {
        total_agents: number
        total_days: number
    }
}

interface DayWiseReportTableProps {
    data: DayWiseReportData | null
    isLoading?: boolean
}

const getCellColor = (durationSeconds: number, maxDuration: number): string => {
    if (durationSeconds === 0) return 'bg-gray-50 text-gray-400 dark:bg-zinc-800/50 dark:text-zinc-650'

    const percentage = (durationSeconds / maxDuration) * 100

    if (percentage >= 80) return 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 font-semibold'
    if (percentage >= 60) return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 font-medium'
    if (percentage >= 40) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-350'
    if (percentage >= 20) return 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-350'
    return 'bg-red-50 text-red-650 dark:bg-red-950/30 dark:text-red-400'
}

const formatDuration = (seconds: number): string => {
    if (seconds === 0) return '0h 0m'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
}

export function DayWiseReportTable({ data, isLoading }: DayWiseReportTableProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)
    const [showScrollHint, setShowScrollHint] = useState(true)

    // Calculate max duration for heatmap coloring
    const maxDuration = useMemo(() => {
        return data?.agents.reduce((max, agent) => {
            const agentMax = Object.values(agent.daily_stats).reduce(
                (m, day) => Math.max(m, day.total_duration_seconds),
                0
            )
            return Math.max(max, agentMax)
        }, 0) || 1
    }, [data])

    // Calculate daily totals across all agents
    const dailyTotals = useMemo(() => {
        return data?.dates.reduce((totals, date) => {
            let totalCalls = 0
            let totalConnected = 0
            let totalMissed = 0
            let totalDuration = 0

            data.agents.forEach(agent => {
                const dayStats = agent.daily_stats[date]
                if (dayStats) {
                    totalCalls += dayStats.total_calls
                    totalConnected += dayStats.connected
                    totalMissed += dayStats.missed
                    totalDuration += dayStats.total_duration_seconds
                }
            })

            totals[date] = {
                total_calls: totalCalls,
                connected: totalConnected,
                missed: totalMissed,
                total_duration_seconds: totalDuration,
                total_duration: formatDuration(totalDuration)
            }

            return totals
        }, {} as Record<string, { total_calls: number; connected: number; missed: number; total_duration_seconds: number; total_duration: string }>) || {}
    }, [data])

    // Calculate grand total
    const grandTotal = useMemo(() => {
        return data?.agents.reduce((total, agent) => {
            return total + agent.period_total.total_duration_seconds
        }, 0) || 0
    }, [data])

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
            setCanScrollLeft(scrollLeft > 0)
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
        }
    }

    useEffect(() => {
        checkScroll()
        const container = scrollContainerRef.current
        if (container) {
            container.addEventListener('scroll', checkScroll)
            window.addEventListener('resize', checkScroll)
            return () => {
                container.removeEventListener('scroll', checkScroll)
                window.removeEventListener('resize', checkScroll)
            }
        }
    }, [data])

    useEffect(() => {
        if (showScrollHint && data && data.dates.length > 7) {
            const timer = setTimeout(() => setShowScrollHint(false), 5000)
            return () => clearTimeout(timer)
        }
    }, [showScrollHint, data])

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300
            const targetScroll = scrollContainerRef.current.scrollLeft +
                (direction === 'left' ? -scrollAmount : scrollAmount)

            scrollContainerRef.current.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            })
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-8 bg-gray-100 dark:bg-zinc-800 animate-pulse rounded" />
                <div className="h-64 bg-gray-100 dark:bg-zinc-800 animate-pulse rounded" />
            </div>
        )
    }

    if (!data || data.agents.length === 0) {
        return (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
                No data available for the selected period.
            </div>
        )
    }

    return (
        <TooltipProvider>
            <div className="space-y-4 w-full overflow-hidden">
                {/* Summary Info and Controls */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{data.meta.total_agents} agents</span>
                        <span>•</span>
                        <span>{data.meta.total_days} days</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Legend */}
                        <div className="flex items-center gap-2 text-xs">
                            <div className="flex items-center gap-1">
                                <div className="h-3 w-3 bg-green-100 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded" />
                                <span>High</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-3 w-3 bg-yellow-100 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800 rounded" />
                                <span>Medium</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-3 w-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded" />
                                <span>No Activity</span>
                            </div>
                        </div>

                        {/* Scroll Controls */}
                        {data.dates.length > 7 && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => scroll('left')}
                                    disabled={!canScrollLeft}
                                    className="gap-1"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Scroll Left
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => scroll('right')}
                                    disabled={!canScrollRight}
                                    className="gap-1"
                                >
                                    Scroll Right
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Scroll Hint */}
                {showScrollHint && canScrollRight && data.dates.length > 7 && (
                    <div className="flex items-center justify-center">
                        <Badge className="bg-blue-600 text-white animate-pulse">
                            <ChevronRight className="h-3 w-3 mr-1" />
                            Use the scroll buttons above or scroll horizontally to view all {data.dates.length} days
                        </Badge>
                    </div>
                )}

                {/* Table Container - Fixed width, scrolls horizontally & vertically */}
                <div className="relative w-full">
                    {/* Table - Scrolls horizontally & vertically with height restriction for sticky header */}
                    <div
                        ref={scrollContainerRef}
                        className="overflow-x-auto overflow-y-auto rounded-md border border-zinc-200 dark:border-zinc-800 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-gray-100 dark:scrollbar-track-zinc-900 w-full max-h-[70vh]"
                        style={{ scrollbarWidth: 'thin', maxWidth: '100%' }}
                    >
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-50 dark:bg-zinc-900 sticky top-0 z-40">
                                <tr className="border-b-2 border-zinc-200 dark:border-zinc-800">
                                    {/* Sticky agent column header */}
                                    <th className="sticky left-0 top-0 z-50 bg-gray-50 dark:bg-zinc-900 px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 border-b-2 border-r border-zinc-200 dark:border-zinc-800 min-w-[220px]">
                                        Agent
                                    </th>

                                    {/* Date columns */}
                                    {data.dates.map((date) => {
                                        const parsedDate = safeParseDate(date)
                                        const isWeekend = parsedDate.getDay() === 0 || parsedDate.getDay() === 6
                                        return (
                                            <th
                                                key={date}
                                                className={cn(
                                                    "sticky top-0 z-30 px-4 py-3 text-center text-xs font-semibold border-b-2 min-w-[100px] whitespace-nowrap transition-colors",
                                                    isWeekend
                                                        ? "bg-red-50/70 text-red-800 dark:bg-red-950/30 dark:text-red-400 border-red-100 dark:border-red-950"
                                                        : "bg-gray-50 text-gray-700 dark:bg-zinc-900 dark:text-gray-300 border-zinc-200 dark:border-zinc-800"
                                                )}
                                            >
                                                <div className="flex flex-col">
                                                    <span>{format(parsedDate, 'dd MMM')}</span>
                                                    <span className={cn(
                                                        "text-[10px] font-bold tracking-wider uppercase mt-0.5",
                                                        isWeekend ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"
                                                    )}>
                                                        {format(parsedDate, 'EEE')}
                                                    </span>
                                                </div>
                                            </th>
                                        )
                                    })}

                                    {/* Total column */}
                                    <th className="sticky right-0 top-0 z-50 bg-gray-50 dark:bg-zinc-900 px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 border-b-2 border-l border-zinc-200 dark:border-zinc-800 min-w-[120px]">
                                        <div className="flex items-center justify-center gap-1">
                                            Period Total
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Info className="h-3 w-3 text-gray-400" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    Total for selected period
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.agents.map((agent, idx) => {
                                    const rowBg = idx % 2 === 0 ? "bg-white dark:bg-zinc-950" : "bg-gray-50 dark:bg-zinc-900/40"
                                    return (
                                        <tr
                                            key={agent.agent_id}
                                            className={cn(
                                                "hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors",
                                                rowBg
                                            )}
                                        >
                                            {/* Sticky agent name with employee code */}
                                            <td className={cn("sticky left-0 z-10 px-4 py-3 text-sm font-medium border-b border-r border-zinc-200 dark:border-zinc-850", rowBg)}>
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                                                        idx % 3 === 0 ? "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" :
                                                        idx % 3 === 1 ? "bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400" :
                                                        "bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-400"
                                                    )}>
                                                        {agent.agent_name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">{agent.agent_name}</span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">{agent.employee_code}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Daily stats */}
                                            {data.dates.map((date) => {
                                                const stats = agent.daily_stats[date] || {
                                                    total_calls: 0,
                                                    connected: 0,
                                                    missed: 0,
                                                    total_duration: '0h 0m',
                                                    total_duration_seconds: 0,
                                                    first_call_time: null
                                                }
                                                const parsedDate = safeParseDate(date)
                                                const isWeekend = parsedDate.getDay() === 0 || parsedDate.getDay() === 6
                                                const cellColorClass = getCellColor(stats.total_duration_seconds, maxDuration)
                                                const formattedDate = format(parsedDate, 'PPP')
                                                const titleText = `${formattedDate}\n` +
                                                    `Total Calls: ${stats.total_calls}\n` +
                                                    `Connected: ${stats.connected}\n` +
                                                    `Missed: ${stats.missed}\n` +
                                                    `Duration: ${stats.total_duration}` +
                                                    (stats.first_call_time ? `\nFirst Call: ${stats.first_call_time}` : '')

                                                return (
                                                    <td
                                                        key={date}
                                                        className={cn(
                                                            "px-4 py-3 text-center text-sm border-b border-zinc-200 dark:border-zinc-800 transition-colors",
                                                            isWeekend && "bg-red-50/20 dark:bg-red-950/5"
                                                        )}
                                                    >
                                                        <div
                                                            title={titleText}
                                                            className={cn(
                                                                "rounded px-2 py-1 cursor-pointer transition-all hover:shadow-md",
                                                                cellColorClass
                                                            )}
                                                        >
                                                            {stats.total_duration}
                                                        </div>
                                                    </td>
                                                )
                                            })}

                                            {/* Period total */}
                                            <td className={cn("sticky right-0 z-10 px-4 py-3 text-center border-b border-l border-zinc-200 dark:border-zinc-850", rowBg)}>
                                                <div
                                                    title={`Period Summary\nTotal Calls: ${agent.period_total.total_calls}\nConnected: ${agent.period_total.connected}\nMissed: ${agent.period_total.missed}`}
                                                    className="font-bold text-sm bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 rounded px-2 py-1 cursor-pointer"
                                                >
                                                    {agent.period_total.total_duration}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>

                            {/* Footer - Daily Totals */}
                            <tfoot className="bg-gray-100 dark:bg-zinc-800 border-t-2 border-gray-300 dark:border-zinc-700 sticky bottom-0 z-40">
                                <tr>
                                    {/* Sticky total label */}
                                    <td className="sticky left-0 z-50 bg-gray-100 dark:bg-zinc-800 px-4 py-3 text-sm font-bold border-r border-gray-300 dark:border-zinc-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                                        <div className="flex items-center gap-2">
                                            <span>Day-Wise Total</span>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Info className="h-3 w-3 text-gray-400" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    Sum of all agents for each day
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </td>

                                    {/* Daily totals */}
                                    {data.dates.map((date) => {
                                        const dayTotal = dailyTotals[date]
                                        const parsedDate = safeParseDate(date)
                                        const isWeekend = parsedDate.getDay() === 0 || parsedDate.getDay() === 6
                                        return (
                                            <td
                                                key={date}
                                                className={cn(
                                                    "sticky bottom-0 z-30 px-4 py-3 text-center text-sm font-semibold border-t border-b border-zinc-200 dark:border-zinc-700 transition-colors",
                                                    isWeekend
                                                        ? "bg-red-50/70 text-red-800 dark:bg-red-950/20 dark:text-red-400"
                                                        : "bg-gray-100 text-gray-700 dark:bg-zinc-850 dark:text-gray-300"
                                                )}
                                            >
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300 rounded px-2 py-1 cursor-pointer font-bold">
                                                            {dayTotal.total_duration}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs">
                                                        <div className="space-y-1 text-xs">
                                                            <p className="font-semibold">{format(parsedDate, 'PPP')}</p>
                                                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
                                                                <span className="text-gray-500">Total Calls:</span>
                                                                <span className="font-medium">{dayTotal.total_calls}</span>

                                                                <span className="text-gray-500">Connected:</span>
                                                                <span className="font-medium text-green-600">{dayTotal.connected}</span>

                                                                <span className="text-gray-500">Missed:</span>
                                                                <span className="font-medium text-red-600">{dayTotal.missed}</span>

                                                                <span className="text-gray-500">Duration:</span>
                                                                <span className="font-medium">{dayTotal.total_duration}</span>
                                                            </div>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </td>
                                        )
                                    })}

                                    {/* Grand total */}
                                    <td className="sticky right-0 bottom-0 z-50 bg-gray-150 dark:bg-zinc-800 px-4 py-3 text-center border-l border-zinc-250 dark:border-zinc-700 border-t border-b font-bold">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 rounded px-2 py-1 cursor-pointer font-bold text-sm">
                                                    {formatDuration(grandTotal)}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <div className="space-y-1 text-xs">
                                                    <p className="font-semibold">Grand Total</p>
                                                    <p className="text-gray-500 dark:text-gray-400">
                                                        Total duration across all agents and days
                                                    </p>
                                                    <p className="font-medium mt-2">
                                                        {formatDuration(grandTotal)}
                                                    </p>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    )
}
