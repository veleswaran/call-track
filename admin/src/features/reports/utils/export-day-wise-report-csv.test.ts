import { describe, it, expect } from "vitest"
import { generateDayWiseReportCsv } from "./export-day-wise-report-csv"
import type { DayWiseReportData } from "@features/reports/components/day-wise-report-table"

const mockData: DayWiseReportData = {
    agents: [
        {
            agent_id: 1,
            agent_name: "John Doe",
            employee_code: "EMP001",
            daily_stats: {
                "2024-03-01": {
                    total_calls: 10,
                    connected: 8,
                    missed: 2,
                    total_duration: "1h 30m",
                    total_duration_seconds: 5400,
                    first_call_time: "09:00 AM",
                },
                "2024-03-02": {
                    total_calls: 0,
                    connected: 0,
                    missed: 0,
                    total_duration: "0h 0m",
                    total_duration_seconds: 0,
                    first_call_time: null,
                },
            },
            period_total: {
                total_calls: 10,
                connected: 8,
                missed: 2,
                total_duration: "1h 30m",
                total_duration_seconds: 5400,
            },
        },
        {
            agent_id: 2,
            agent_name: 'Jane "Smith"',
            employee_code: "EMP002",
            daily_stats: {
                "2024-03-01": {
                    total_calls: 5,
                    connected: 4,
                    missed: 1,
                    total_duration: "45m",
                    total_duration_seconds: 2700,
                    first_call_time: "10:00 AM",
                },
                "2024-03-02": {
                    total_calls: 3,
                    connected: 2,
                    missed: 1,
                    total_duration: "30m",
                    total_duration_seconds: 1800,
                    first_call_time: "11:00 AM",
                },
            },
            period_total: {
                total_calls: 8,
                connected: 6,
                missed: 2,
                total_duration: "1h 15m",
                total_duration_seconds: 4500,
            },
        },
    ],
    dates: ["2024-03-01", "2024-03-02"],
    meta: {
        total_agents: 2,
        total_days: 2,
    },
}

describe("generateDayWiseReportCsv", () => {
    it("generates CSV with headers, agent rows, and footer totals", () => {
        const csv = generateDayWiseReportCsv(mockData)
        const lines = csv.split("\n")

        expect(lines).toHaveLength(4)
        expect(lines[0]).toContain("Agent,Employee Code")
        expect(lines[0]).toContain("01 Mar (Fri)")
        expect(lines[0]).toContain("02 Mar (Sat)")
        expect(lines[0]).toContain("Period Total")
        expect(lines[1]).toBe("John Doe,EMP001,1h 30m,0h 0m,1h 30m")
        expect(lines[2]).toBe('"Jane ""Smith""",EMP002,45m,30m,1h 15m')
        expect(lines[3]).toBe("Day-Wise Total,,1h 45m,30m,2h 15m")
    })

    it("escapes values containing commas or quotes", () => {
        const dataWithSpecialChars: DayWiseReportData = {
            ...mockData,
            agents: [
                {
                    ...mockData.agents[0],
                    agent_name: "Agent, Jr.",
                },
            ],
        }

        const csv = generateDayWiseReportCsv(dataWithSpecialChars)
        expect(csv.split("\n")[1]).toContain('"Agent, Jr."')
    })

    it("uses fallback employee code when value is null", () => {
        const dataWithNullCode: DayWiseReportData = {
            ...mockData,
            agents: [
                {
                    ...mockData.agents[0],
                    agent_id: 42,
                    employee_code: null as unknown as string,
                },
            ],
        }

        const csv = generateDayWiseReportCsv(dataWithNullCode)
        expect(csv.split("\n")[1]).toBe("John Doe,EMP-042,1h 30m,0h 0m,1h 30m")
    })
})
