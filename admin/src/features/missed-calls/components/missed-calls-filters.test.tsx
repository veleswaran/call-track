import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MissedCallsFilters } from "./missed-calls-filters"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { api } from "@shared/api/api"

// Mock api
vi.mock("@shared/api/api", () => ({
    api: {
        get: vi.fn(),
    },
}))
// Mock Auth
const mockUseAuth = vi.fn().mockReturnValue({
    user: { roles: ["admin"] }
});
vi.mock("@features/auth/hooks/use-auth", () => ({
    useAuth: () => mockUseAuth(),
}));
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
    SelectTrigger: () => null,
    SelectValue: () => null,
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

// Mock MultiSelectAsync to be test-friendly
vi.mock("@shared/components/multi-select-async", () => ({
    MultiSelectAsync: ({ value, onChange, label }: { value: string[]; onChange: (val: string[]) => void; label: string }) => (
        <div data-testid={`async-select-${label}`}>
            <label>{label}</label>
            <input 
                data-testid={`input-${label}`}
                value={value.join(",")} 
                onChange={(e) => onChange(e.target.value.split(",").filter(Boolean))} 
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

describe("MissedCallsFilters", () => {
    const onFilterChange = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(api.get).mockImplementation((url) => {
            if (url.includes("settings")) {
                return Promise.resolve({
                    data: {
                        enable_missed_call_team_filter: true,
                        enable_missed_call_agent_filter: true,
                        enable_missed_call_internal_filter: true,
                        enable_missed_call_sim_filter: true,
                    }
                })
            }
            if (url.includes("agents")) {
                return Promise.resolve({
                    data: [
                        { id: 1, name: "Agent 1" },
                    ],
                })
            }
            return Promise.resolve({ data: [] })
        })
    })

    it("renders correctly with initial states", async () => {
        render(<MissedCallsFilters onFilterChange={onFilterChange} />, {
            wrapper: createWrapper(),
        })

        // Wait for dynamic elements first
        await screen.findByTestId("async-select-Team")
        await screen.findByTestId("async-select-Agent")

        expect(screen.getAllByTestId("mock-select")).toHaveLength(4)
        expect(screen.getByTestId("async-select-Team")).toBeInTheDocument()
        expect(screen.getByTestId("async-select-Agent")).toBeInTheDocument()
    })

    it("calls onFilterChange with correct values when filters are applied", async () => {
        render(<MissedCallsFilters onFilterChange={onFilterChange} />, {
            wrapper: createWrapper(),
        })

        // Wait for dynamic elements first
        await screen.findByTestId("async-select-Team")

        // Change status
        const statusSelects = screen.getAllByTestId("mock-select")
        const statusSelect = statusSelects[1] // Second select is status
        const simSelect = statusSelects[3] // Fourth select is sim
        fireEvent.change(statusSelect, { target: { value: "pending" } })
        fireEvent.change(simSelect, { target: { value: "1" } })

        // Change Team
        const teamInput = screen.getByTestId("input-Team")
        fireEvent.change(teamInput, { target: { value: "5" } })

        // Change Agent
        const agentInput = screen.getByTestId("input-Agent")
        fireEvent.change(agentInput, { target: { value: "10" } })

        // Apply filters
        const filterButton = screen.getByText("Filter").closest("button")!
        fireEvent.click(filterButton)

        expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({
            status: "pending",
            team_ids: [5],
            agent_id: "10",
            sim_slot: 1
        }))
    })

    it("handles all quick date selection branches", async () => {
        render(<MissedCallsFilters onFilterChange={onFilterChange} />, {
            wrapper: createWrapper(),
        })

        const periodSelect = screen.getAllByTestId("mock-select")[0]

        const periods = ["yesterday", "this_week", "this_month", "last_7_days", "last_30_days", "today", "custom", "unknown"]
        
        for (const period of periods) {
            fireEvent.change(periodSelect, { target: { value: period } })
            
            // Apply to hit the date branch in handleApplyFilters
            const filterButton = screen.getByText("Filter").closest("button")!
            fireEvent.click(filterButton)
            
            expect(onFilterChange).toHaveBeenCalled()
        }
    })

    it("resets filters when reset button is clicked", async () => {
        render(<MissedCallsFilters onFilterChange={onFilterChange} />, {
            wrapper: createWrapper(),
        })

        const resetButton = screen.getByTitle("Reset Filters")
        fireEvent.click(resetButton)

        expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({
            status: "all",
            agent_id: null,
            team_ids: null
        }))
    })
})

