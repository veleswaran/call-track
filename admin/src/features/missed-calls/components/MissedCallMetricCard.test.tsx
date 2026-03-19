import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { MissedCallMetricCard } from "./MissedCallMetricCard"

// Mock Tooltip components as they rely on Radix UI's Portal which can be tricky in JSDOM
vi.mock("@shared/components/ui/tooltip", () => ({
    Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe("MissedCallMetricCard", () => {
    it("renders the title and total value", () => {
        render(
            <MissedCallMetricCard
                total={100}
                pending={10}
                unattended={20}
                resolved={70}
                title="Custom Missed Title"
            />
        )

        expect(screen.getByText("Custom Missed Title")).toBeInTheDocument()
        expect(screen.getByText("100")).toBeInTheDocument()
    })

    it("renders loading state", () => {
        const { container } = render(
            <MissedCallMetricCard
                total={100}
                pending={10}
                unattended={20}
                resolved={70}
                isLoading={true}
            />
        )

        expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
        expect(screen.queryByText("100")).not.toBeInTheDocument()
    })

    it("renders change percentage when provided", () => {
        render(
            <MissedCallMetricCard
                total={100}
                pending={10}
                unattended={20}
                resolved={70}
                changePercent={15}
            />
        )

        expect(screen.getByText("+15%")).toBeInTheDocument()
        expect(screen.getByText("vs last period")).toBeInTheDocument()
    })
})
