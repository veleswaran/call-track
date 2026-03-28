import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ReportSummary } from "./report-summary"

describe("ReportSummary", () => {
    const mockMetrics = [
        { label: "Total Calls", value: "1,234", icon: "phone" },
        { label: "Connected", value: "850", percentage: 68.8, icon: "check-circle", color: "text-green-500" },
        { label: "Missed", value: "384", percentage: 31.1, icon: "x-circle", color: "text-red-500" },
    ]

    it("renders loading state correctly", () => {
        const { container } = render(<ReportSummary metrics={[]} isLoading={true} />)
        // The wrapper div should have the grid classes
        expect(container.firstChild).toHaveClass("grid")
        // Should render 6 skeleton cards as per code
        expect(container.querySelectorAll(".animate-pulse")).toHaveLength(6)
    })

    it("renders metrics correctly", () => {
        render(<ReportSummary metrics={mockMetrics} />)

        expect(screen.getByText("Total Calls")).toBeInTheDocument()
        expect(screen.getByText("1,234")).toBeInTheDocument()

        expect(screen.getByText("Connected")).toBeInTheDocument()
        expect(screen.getByText("850")).toBeInTheDocument()
        expect(screen.getByText("68.8%")).toBeInTheDocument()

        expect(screen.getByText("Missed")).toBeInTheDocument()
        expect(screen.getByText("384")).toBeInTheDocument()
        expect(screen.getByText("31.1%")).toBeInTheDocument()
    })

    it("uses default icon when icon is missing or not in map", () => {
        const minimalMetrics = [
            { label: "No Icon", value: "100" },
            { label: "Invalid Icon", value: "200", icon: "invalid-icon" }
        ]
        render(<ReportSummary metrics={minimalMetrics} />)

        expect(screen.getByText("No Icon")).toBeInTheDocument()
        expect(screen.getByText("Invalid Icon")).toBeInTheDocument()
    })

    it("applies custom color styles correctly", () => {
        render(<ReportSummary metrics={mockMetrics} />)

        const connectedPercentage = screen.getByText("68.8%")
        expect(connectedPercentage).toHaveClass("text-green-500")
        expect(connectedPercentage).toHaveClass("bg-green-100")
    })
})
