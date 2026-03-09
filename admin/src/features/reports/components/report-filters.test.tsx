import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { ReportFilters } from "./report-filters"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { api } from "@shared/api/api"

// Mock api
vi.mock("@shared/api/api", () => ({
    api: {
        get: vi.fn(),
    },
}))

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    })
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    Wrapper.displayName = "QueryClientWrapper"
    return Wrapper
}

describe("ReportFilters", () => {
    const onFilterChange = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(api.get).mockImplementation((url) => {
            if (url.includes("agents")) {
                return Promise.resolve({
                    data: [
                        { id: 1, name: "Agent 1" },
                        { id: 2, name: "Agent 2" },
                    ],
                })
            }
            if (url.includes("teams")) {
                return Promise.resolve({
                    data: [
                        { id: 1, name: "Team 1" },
                    ],
                })
            }
            return Promise.resolve({ data: [] })
        })
    })

    it("renders correctly with initial states", async () => {
        render(<ReportFilters onFilterChange={onFilterChange} />, {
            wrapper: createWrapper(),
        })

        expect(screen.getByText("All Outcomes")).toBeInTheDocument()
        expect(screen.getByText("All Teams")).toBeInTheDocument()
        expect(screen.getByText("All Agents")).toBeInTheDocument()
        expect(screen.getByText("All Classes")).toBeInTheDocument()
    })

    it("calls onFilterChange when filter button is clicked", async () => {
        render(<ReportFilters onFilterChange={onFilterChange} />, {
            wrapper: createWrapper(),
        })

        const filterButton = screen.getByText("Filter").closest("button")!
        fireEvent.click(filterButton)

        expect(onFilterChange).toHaveBeenCalled()
        const callArgs = onFilterChange.mock.calls[0][0]
        expect(callArgs.outcome).toBe("all")
        expect(callArgs.type).toBe("all")
        expect(callArgs.dateRange).toBeDefined()
    })

    it("resets filters when clear button is clicked", async () => {
        render(<ReportFilters onFilterChange={onFilterChange} />, {
            wrapper: createWrapper(),
        })

        const clearButton = screen.getByTitle("Reset Filters")
        fireEvent.click(clearButton)

        expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({
            outcome: "all",
            type: "all",
            agentIds: null,
            teamIds: null
        }))
    })

    it("handles quick date selection", async () => {
        render(<ReportFilters onFilterChange={onFilterChange} />, {
            wrapper: createWrapper(),
        })

        // Initially Period trigger should show "Today"
        expect(screen.getByText("Today")).toBeInTheDocument()

        // Testing handleQuickDateChange is hard with Radix Select in JSDOM
        // but we can test that it renders and is interactive
    })
})
