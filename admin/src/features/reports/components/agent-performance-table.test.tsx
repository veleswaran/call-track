import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { AgentPerformanceTable, type AgentPerformance } from "./agent-performance-table"

// Mock next/link
vi.mock("next/link", () => ({
    default: ({ children, href }: { children: React.ReactNode, href: string }) => <a href={href}>{children}</a>
}))

describe("AgentPerformanceTable", () => {
    const mockData: AgentPerformance[] = [
        {
            id: 1,
            agent: "John Doe",
            employee_code: "EMP001",
            total_calls: 100,
            connected: 80,
            missed: 20,
            avg_duration: "2m 30s",
            total_duration: "4h 10m",
            handling_rate: 80,
            performance: "Excellent"
        },
        {
            id: 2,
            agent: "Jane Smith",
            employee_code: "EMP002",
            total_calls: 50,
            connected: 20,
            missed: 30,
            avg_duration: "1m 15s",
            total_duration: "1h 5m",
            handling_rate: 40,
            performance: "Poor"
        }
    ]

    const mockFilters = {
        dateRange: {
            from: new Date("2024-03-01"),
            to: new Date("2024-03-31")
        },
        status: "all",
        type: "all"
    }

    it("renders table with data correctly", () => {
        render(<AgentPerformanceTable data={mockData} filters={mockFilters} />)

        expect(screen.getByText("John Doe")).toBeInTheDocument()
        expect(screen.getByText("Jane Smith")).toBeInTheDocument()
        expect(screen.getByText("EMP001")).toBeInTheDocument()
        expect(screen.getByText("Excellent")).toBeInTheDocument()
    })

    it("sorts data when header is clicked", () => {
        render(<AgentPerformanceTable data={mockData} filters={mockFilters} />)

        const totalCallsHeader = screen.getByRole("button", { name: /total calls/i })

        // Initial order: John (100), Jane (50)
        let rows = screen.getAllByRole("row").slice(1) // exclude header
        expect(rows[0]).toHaveTextContent("John Doe")

        // Click to sort asc
        fireEvent.click(totalCallsHeader)
        rows = screen.getAllByRole("row").slice(1)
        expect(rows[0]).toHaveTextContent("Jane Smith") // 50 < 100

        // Click to sort desc
        fireEvent.click(totalCallsHeader)
        rows = screen.getAllByRole("row").slice(1)
        expect(rows[0]).toHaveTextContent("John Doe") // 100 > 50
    })

    it("renders empty state when no data", () => {
        render(<AgentPerformanceTable data={[]} filters={mockFilters} />)
        expect(screen.getByText(/No agent performance data available/i)).toBeInTheDocument()
    })

    it("generates correct links for 'View Calls'", () => {
        render(<AgentPerformanceTable data={mockData} filters={mockFilters} />)
        const links = screen.getAllByRole("link", { name: /view calls/i })
        expect(links[0].getAttribute("href")).toContain("agents")
        expect(links[0].getAttribute("href")).toContain("1")
        expect(links[0].getAttribute("href")).toContain("start_date=2024-03-01")
    })
})
