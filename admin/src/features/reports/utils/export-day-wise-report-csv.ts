import { format } from "date-fns"
import type { DayWiseReportData } from "@features/reports/components/day-wise-report-table"

const safeParseDate = (dateStr: string): Date => {
    const parts = dateStr.split("-")
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        const day = parseInt(parts[2], 10)
        return new Date(year, month, day)
    }
    return new Date(dateStr)
}

const formatDuration = (seconds: number): string => {
    if (seconds === 0) return "0h 0m"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
}

const escapeCsvValue = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) {
        return ""
    }
    const str = String(value)
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

const formatDateHeader = (date: string): string => {
    const parsed = safeParseDate(date)
    return `${format(parsed, "dd MMM")} (${format(parsed, "EEE")})`
}

const formatEmployeeCode = (
    employeeCode: string | null | undefined,
    agentId: number
): string => {
    if (employeeCode) {
        return employeeCode
    }

    return `EMP-${String(agentId).padStart(3, "0")}`
}

export function generateDayWiseReportCsv(data: DayWiseReportData): string {
    const dateHeaders = data.dates.map(formatDateHeader)
    const headerRow = ["Agent", "Employee Code", ...dateHeaders, "Period Total"]

    const agentRows = data.agents.map((agent) => {
        const dailyValues = data.dates.map((date) => {
            const stats = agent.daily_stats[date]
            return stats?.total_duration ?? "0h 0m"
        })

        return [
            agent.agent_name,
            formatEmployeeCode(agent.employee_code, agent.agent_id),
            ...dailyValues,
            agent.period_total.total_duration,
        ]
    })

    const dailyTotals = data.dates.map((date) => {
        let totalDuration = 0
        data.agents.forEach((agent) => {
            const stats = agent.daily_stats[date]
            if (stats) {
                totalDuration += stats.total_duration_seconds
            }
        })
        return formatDuration(totalDuration)
    })

    const grandTotal = data.agents.reduce(
        (total, agent) => total + agent.period_total.total_duration_seconds,
        0
    )

    const footerRow = ["Day-Wise Total", "", ...dailyTotals, formatDuration(grandTotal)]

    const rows = [headerRow, ...agentRows, footerRow]

    return rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n")
}

export function downloadDayWiseReportCsv(
    data: DayWiseReportData,
    filename?: string
): void {
    const csv = generateDayWiseReportCsv(data)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download =
        filename ??
        `agent-performance-day-wise-${data.dates[0]}-to-${data.dates[data.dates.length - 1]}.csv`
    link.click()
    URL.revokeObjectURL(url)
}
