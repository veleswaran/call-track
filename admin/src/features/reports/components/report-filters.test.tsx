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

// Mock dynamic import for teamsApi
vi.mock("@features/teams/api/teams-api", () => ({
    teamsApi: {
        getTeams: vi.fn().mockResolvedValue({ data: [] }),
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

interface AsyncSelectMockProps {
    value: string;
    onChange: (value: string) => void;
    label: string;
    loadOptions?: (input: string) => Promise<unknown>;
}

interface MultiSelectAsyncMockProps {
    value: string[];
    onChange: (value: string[]) => void;
    label: string;
    loadOptions?: (input: string) => Promise<unknown>;
}

// Mock AsyncSelect to be test-friendly
vi.mock("@shared/components/async-select", () => ({
    AsyncSelect: ({ value, onChange, label, loadOptions }: AsyncSelectMockProps) => {
        // Trigger loadOptions for coverage
        loadOptions?.("");
        return (
            <div data-testid={`async-select-${label}`}>
                <label>{label}</label>
                <input 
                    data-testid={`input-${label}`}
                    value={value} 
                    onChange={(e) => onChange(e.target.value)} 
                />
            </div>
        )
    },
}))

// Mock MultiSelectAsync to be test-friendly
vi.mock("@shared/components/multi-select-async", () => ({
    MultiSelectAsync: ({ value, onChange, label, loadOptions }: MultiSelectAsyncMockProps) => {
        // Trigger loadOptions for coverage
        loadOptions?.("");
        return (
            <div data-testid={`async-select-${label}`}>
                <label>{label}</label>
                <input 
                    data-testid={`input-${label}`}
                    value={value.join(",")} 
                    onChange={(e) => onChange(e.target.value.split(",").filter(Boolean))} 
                />
            </div>
        )
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
            if (url.includes("settings")) {
                return Promise.resolve({
                    data: {
                        enable_report_agent_filter: true,
                        enable_report_team_filter: true,
                        enable_report_class_filter: true,
                        enable_report_outcome_filter: true,
                        enable_report_internal_filter: true,
                        enable_report_sim_filter: true,
                    }
                })
            }
            return Promise.resolve({ data: [] })
        })
    })

    it("renders correctly with initial states", async () => {
        render(<ReportFilters onFilterChange={onFilterChange} />, {
            wrapper: createWrapper(),
        })

        // Wait for dynamic elements to appear first
        await screen.findByTestId("async-select-Team")
        await screen.findByTestId("async-select-Agent")

        expect(screen.getAllByTestId("mock-select")).toHaveLength(5)
        expect(screen.getByTestId("async-select-Team")).toBeInTheDocument()
        expect(screen.getByTestId("async-select-Agent")).toBeInTheDocument()
    })

    it("calls onFilterChange when filter button is clicked", async () => {
        render(<ReportFilters onFilterChange={onFilterChange} />, {
            wrapper: createWrapper(),
        })

        const filterButton = (await screen.findByText("Filter")).closest("button")!
        fireEvent.click(filterButton)

        expect(onFilterChange).toHaveBeenCalled()
    })

    it("resets filters when clear button is clicked", async () => {
        render(<ReportFilters onFilterChange={onFilterChange} />, {
            wrapper: createWrapper(),
        })

        const clearButton = await screen.findByTitle("Reset Filters")
        fireEvent.click(clearButton)

        expect(onFilterChange).toHaveBeenCalled()
    })

    it("handles all quick date selection branches", async () => {
        render(<ReportFilters onFilterChange={onFilterChange} />, {
            wrapper: createWrapper(),
        })

        // Wait for dynamic elements
        await screen.findByTestId("async-select-Team")
        
        const periodSelect = screen.getAllByTestId("mock-select")[0]
        const periods = ["yesterday", "this_week", "this_month", "last_7_days", "last_30_days", "today", "custom", "unknown"]
        
        for (const period of periods) {
            fireEvent.change(periodSelect, { target: { value: period } })
            fireEvent.click(screen.getByText("Filter"))
            expect(onFilterChange).toHaveBeenCalled()
        }
    })

    it("updates other filter values correctly", async () => {
        render(<ReportFilters onFilterChange={onFilterChange} />, {
            wrapper: createWrapper(),
        })

        // Wait for dynamic elements first
        await screen.findByTestId("async-select-Team")
        await screen.findByTestId("async-select-Agent")

        const selects = screen.getAllByTestId("mock-select")
        const outcomeSelect = selects[1]
        const classSelect = selects[2]
        const simSelect = selects[4]

        fireEvent.change(outcomeSelect, { target: { value: "Connected" } })
        fireEvent.change(classSelect, { target: { value: "PERSONAL" } })
        fireEvent.change(simSelect, { target: { value: "0" } })

        fireEvent.change(screen.getByTestId("input-Team"), { target: { value: "TeamX" } })
        fireEvent.change(screen.getByTestId("input-Agent"), { target: { value: "AgentY" } })

        fireEvent.click(screen.getByText("Filter"))

        expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({
            outcome: "Connected",
            type: "PERSONAL",
            teamIds: ["TeamX"],
            agentIds: ["AgentY"],
            simSlot: 0
        }))
    })
})

