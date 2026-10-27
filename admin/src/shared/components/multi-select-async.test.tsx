import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MultiSelectAsync } from "./multi-select-async";
import { describe, it, expect, vi } from "vitest";

describe("MultiSelectAsync", () => {
    const mockOptions = [
        { label: "Option 1", value: "opt1" },
        { label: "Option 2", value: "opt2" },
        { label: "Option 3", value: "opt3" },
    ];

    it("renders placeholder when empty", () => {
        render(
            <MultiSelectAsync
                value={[]}
                onChange={vi.fn()}
                loadOptions={vi.fn().mockResolvedValue([])}
                placeholder="Select items..."
            />
        );

        expect(screen.getByText("Select items...")).toBeInTheDocument();
    });

    it("renders selected values and badge for multiple items", () => {
        render(
            <MultiSelectAsync
                value={["opt1", "opt2"]}
                onChange={vi.fn()}
                loadOptions={vi.fn().mockResolvedValue(mockOptions)}
            />
        );

        expect(screen.getByText("opt1")).toBeInTheDocument();
        expect(screen.getByText("+1 more")).toBeInTheDocument();
    });

    it("opens popover, searches and selects an option", async () => {
        const onChange = vi.fn();
        const loadOptions = vi.fn().mockResolvedValue(mockOptions);

        render(
            <MultiSelectAsync
                value={[]}
                onChange={onChange}
                loadOptions={loadOptions}
                label="Agents"
            />
        );

        const button = screen.getByRole("combobox");
        fireEvent.click(button);

        // Wait for debounce search to trigger loadOptions
        await waitFor(() => {
            expect(loadOptions).toHaveBeenCalled();
        });

        const input = screen.getByPlaceholderText("Search Agents...");
        fireEvent.change(input, { target: { value: "Option 1" } });

        await waitFor(() => {
            expect(screen.getByText("Option 1")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Option 1"));
        expect(onChange).toHaveBeenCalledWith(["opt1"]);
    });

    it("toggles off an already selected option", async () => {
        const onChange = vi.fn();
        const loadOptions = vi.fn().mockResolvedValue(mockOptions);

        render(
            <MultiSelectAsync
                value={["opt1"]}
                onChange={onChange}
                loadOptions={loadOptions}
            />
        );

        fireEvent.click(screen.getByRole("combobox"));

        await waitFor(() => {
            expect(screen.getAllByText("Option 1").length).toBeGreaterThan(0);
        });

        const optionItems = screen.getAllByText("Option 1");
        fireEvent.click(optionItems[optionItems.length - 1]);
        expect(onChange).toHaveBeenCalledWith([]);
    });

    it("handles selecting 'all' option to reset values", async () => {
        const onChange = vi.fn();
        const loadOptions = vi.fn().mockResolvedValue([
            { label: "All Items", value: "all" },
            ...mockOptions,
        ]);

        render(
            <MultiSelectAsync
                value={["opt1"]}
                onChange={onChange}
                loadOptions={loadOptions}
            />
        );

        fireEvent.click(screen.getByRole("combobox"));

        await waitFor(() => {
            expect(screen.getByText("All Items")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("All Items"));
        expect(onChange).toHaveBeenCalledWith([]);
    });

    it("removes selected value via remove badge button and keydown", async () => {
        const onChange = vi.fn();
        const { rerender } = render(
            <MultiSelectAsync
                value={["opt1"]}
                onChange={onChange}
                loadOptions={vi.fn().mockResolvedValue(mockOptions)}
            />
        );

        const removeButton = screen.getByRole("button", { hidden: true });
        fireEvent.click(removeButton);
        expect(onChange).toHaveBeenCalledWith([]);

        rerender(
            <MultiSelectAsync
                value={["opt1"]}
                onChange={onChange}
                loadOptions={vi.fn().mockResolvedValue(mockOptions)}
            />
        );

        fireEvent.keyDown(removeButton, { key: "Enter" });
        expect(onChange).toHaveBeenCalledWith([]);
    });

    it("displays emptyText when no options are returned", async () => {
        const loadOptions = vi.fn().mockResolvedValue([]);

        render(
            <MultiSelectAsync
                value={[]}
                onChange={vi.fn()}
                loadOptions={loadOptions}
                emptyText="Custom empty message"
            />
        );

        fireEvent.click(screen.getByRole("combobox"));

        await waitFor(() => {
            expect(screen.getByText("Custom empty message")).toBeInTheDocument();
        });
    });

    it("handles loadOptions error gracefully", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const loadOptions = vi.fn().mockRejectedValue(new Error("Network error"));

        render(
            <MultiSelectAsync
                value={[]}
                onChange={vi.fn()}
                loadOptions={loadOptions}
            />
        );

        fireEvent.click(screen.getByRole("combobox"));

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch options:", expect.any(Error));
        });

        consoleSpy.mockRestore();
    });
});
