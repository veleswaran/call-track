import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CustomerSummaryFilters } from "./customer-summary-filters";

vi.mock("@features/settings/hooks/use-settings", () => ({
    useSettingsQuery: vi.fn(() => ({
        data: {
            enable_report_agent_filter: true,
            enable_report_team_filter: true,
            enable_report_outcome_filter: true,
            enable_report_class_filter: true,
            enable_report_internal_filter: true,
            enable_report_sim_filter: true,
        },
    })),
}));

vi.mock("@features/auth/hooks/use-auth", () => ({
    useAuth: vi.fn(() => ({
        user: { name: "Admin", roles: ["admin"] },
    })),
}));

vi.mock("@shared/components/async-select", () => ({
    AsyncSelect: () => <div data-testid="async-select">Agent Select</div>,
}));

vi.mock("@shared/components/multi-select-async", () => ({
    MultiSelectAsync: () => <div data-testid="multi-select-async">Team Select</div>,
}));

describe("CustomerSummaryFilters", () => {
    it("renders quick date filters, selects, and handles reset", () => {
        const onFilterChange = vi.fn();
        render(<CustomerSummaryFilters onFilterChange={onFilterChange} />);

        expect(screen.getByTitle("Reset Filters")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Filter" })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Filter" }));
        expect(onFilterChange).toHaveBeenCalled();

        fireEvent.click(screen.getByTitle("Reset Filters"));
        expect(onFilterChange).toHaveBeenCalled();
    });
});
