import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { ReportCharts } from "./report-charts"

// Mock ResponsiveContainer and other Recharts components to avoid issues in JSDOM
vi.mock("recharts", async (importOriginal) => {
    const original = await importOriginal<typeof import("recharts")>()
    return {
        ...original,
        ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    }
})

describe("ReportCharts", () => {
    const mockData = {
        calls_per_day: [
            { date: "2024-03-01", connected: 10, missed: 5, no_answer: 2 },
            { date: "2024-03-02", connected: 15, missed: 3, no_answer: 1 },
        ],
        status_distribution: [
            { name: "Connected", value: 25 },
            { name: "Missed", value: 8 },
            { name: "No Answer", value: 3 },
        ],
        peak_call_hours: [
            { hour: 9, label: "09:00", value: 5 },
            { hour: 10, label: "10:00", value: 12 },
            { hour: 11, label: "11:00", value: 8 },
        ],
        caller_types: [
            { name: "New", value: 20 },
            { name: "Returning", value: 16 },
        ],
        call_direction_distribution: [
            { name: "Incoming", value: 22 },
            { name: "Outgoing", value: 14 },
        ],
        agent_distribution: [
            { name: "Active", value: 5, fill: "#22c55e" },
            { name: "Inactive", value: 2, fill: "#ef4444" },
        ],
        team_distribution: [
            { name: "Support", value: 3 },
            { name: "Sales", value: 4 },
        ],
    }

    it("renders all charts with titles", () => {
        render(<ReportCharts data={mockData} />)

        expect(screen.getByText("Calls Per Day")).toBeInTheDocument()
        expect(screen.getByText("Status Distribution")).toBeInTheDocument()
        expect(screen.getByText("Peak Call Hours")).toBeInTheDocument()
        expect(screen.getByText("Caller Type Breakdown")).toBeInTheDocument()
        expect(screen.getByText("Call Direction")).toBeInTheDocument()
    })

    it("displays the peak hour text correctly", () => {
        render(<ReportCharts data={mockData} />)
        // Peak is at 10:00 with 12 calls
        expect(screen.getByText(/Most calls occur around 10:00./i)).toBeInTheDocument()
    })

    it("handles empty peak hours gracefully", () => {
        const emptyData = { ...mockData, peak_call_hours: [] }
        render(<ReportCharts data={emptyData} />)
        expect(screen.getByText(/No call data available./i)).toBeInTheDocument()
    })

    it("handles zero values in peak hours", () => {
        const zeroData = { ...mockData, peak_call_hours: [{ hour: 9, label: "09:00", value: 0 }] }
        render(<ReportCharts data={zeroData} />)
        expect(screen.getByText(/No calls recorded in this period./i)).toBeInTheDocument()
    })
})
