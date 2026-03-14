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

interface MockSelectProps {
    children: React.ReactNode;
    onValueChange: (value: string) => void;
    value: string;
}

// Mock Select components to be test-friendly
vi.mock("@shared/components/ui/select", () => ({
    Select: ({ children, onValueChange, value }: MockSelectProps) => (
        <select 
            data-testid="mock-select" 
            value={value} 
            onChange={(e) => onValueChange(e.target.value)}
        >
            {children}
        </select>
    ),
    SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => <option value={value}>{children}</option>,
    SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectValue: ({ placeholder }: { placeholder: string }) => <span>{placeholder}</span>,
}))

interface MockAsyncSelectProps {
    value: string;
    onChange: (value: string) => void;
    label: string;
}

// Mock AsyncSelect to be test-friendly
vi.mock("@shared/components/async-select", () => ({
    AsyncSelect: ({ value, onChange, label }: MockAsyncSelectProps) => (
        <div data-testid={`async-select-${label}`}>
            <label>{label}</label>
            <input 
                data-testid={`input-${label}`}
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
            />
        </div>
    ),
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
        vi.mocked(api.get).mockImplementation(() => Promise.resolve({ data: { data: [] } }))
    })

    it("renders correctly with initial states", () => {
        render(<ReportFilters onFilterChange={onFilterChange} />, {
            wrapper: createWrapper(),
        })

        expect(screen.getAllByTestId("mock-select")).toHaveLength(3)
        expect(screen.getByTestId("async-select-Team")).toBeInTheDocument()
        expect(screen.getByTestId("async-select-Agent")).toBeInTheDocument()
    })

    it("calls onFilterChange when filter button is clicked", () => {
        render(<ReportFilters onFilterChange={onFilterChange} />, {
            wrapper: createWrapper(),
        })

        const filterButton = screen.getByText("Filter").closest("button")!
        fireEvent.click(filterButton)

        expect(onFilterChange).toHaveBeenCalled()
    })

    it("resets filters when clear button is clicked", () => {
        render(<ReportFilters onFilterChange={onFilterChange} />, {
            wrapper: createWrapper(),
        })

        const clearButton = screen.getByTitle("Reset Filters")
        fireEvent.click(clearButton)

        expect(onFilterChange).toHaveBeenCalled()
    })

    it("handles all quick date selection branches", () => {
        render(<ReportFilters onFilterChange={onFilterChange} />, {
            wrapper: createWrapper(),
        })

        const periodSelect = screen.getAllByTestId("mock-select")[0]
        const periods = ["yesterday", "this_week", "this_month", "last_7_days", "last_30_days", "today", "custom", "unknown"]
        
        for (const period of periods) {
            fireEvent.change(periodSelect, { target: { value: period } })
            fireEvent.click(screen.getByText("Filter"))
            expect(onFilterChange).toHaveBeenCalled()
        }
    })

    it("updates other filter values correctly", () => {
        render(<ReportFilters onFilterChange={onFilterChange} />, {
            wrapper: createWrapper(),
        })

        const selects = screen.getAllByTestId("mock-select")
        const outcomeSelect = selects[1]
        const classSelect = selects[2]

        fireEvent.change(outcomeSelect, { target: { value: "Connected" } })
        fireEvent.change(classSelect, { target: { value: "PERSONAL" } })

        fireEvent.change(screen.getByTestId("input-Team"), { target: { value: "TeamX" } })
        fireEvent.change(screen.getByTestId("input-Agent"), { target: { value: "AgentY" } })

        fireEvent.click(screen.getByText("Filter"))

        expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({
            outcome: "Connected",
            type: "PERSONAL",
            teamIds: ["TeamX"],
            agentIds: ["AgentY"]
        }))
    })
})

