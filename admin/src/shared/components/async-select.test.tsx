import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AsyncSelect } from "./async-select";
import { describe, it, expect, vi } from "vitest";

describe("AsyncSelect", () => {
    it("renders placeholder initially", () => {
        render(<AsyncSelect onChange={() => { }} loadOptions={async () => []} />);
        expect(screen.getByRole("combobox")).toHaveTextContent("Select item...");
    });

    it("displays selected label when value matches option", async () => {
        const mockLoadOptions = vi.fn().mockResolvedValue([
            { label: "Phone", value: "phone" }
        ]);
        render(<AsyncSelect onChange={() => { }} loadOptions={mockLoadOptions} value="phone" />);

        await waitFor(() => {
            expect(screen.getByRole("combobox")).toHaveTextContent("Phone");
        });
    });

    it("fetches options and allows selection", async () => {
        const handleChange = vi.fn();
        const mockLoadOptions = vi.fn().mockResolvedValue([
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
        ]);

        render(<AsyncSelect onChange={handleChange} loadOptions={mockLoadOptions} />);

        // Open dropdown
        fireEvent.click(screen.getByRole("combobox"));

        // Should call load (initial load)
        await waitFor(() => {
            expect(mockLoadOptions).toHaveBeenCalled();
            expect(screen.getByText("Option A")).toBeInTheDocument();
        });

        // Click option
        fireEvent.click(screen.getByText("Option A"));

        expect(handleChange).toHaveBeenCalledWith("a");
        // Popover should close (impl detail, maybe check if text updated)
    });

    it("searches inputs with debounce", async () => {
        const mockLoadOptions = vi.fn().mockResolvedValue([]);
        render(<AsyncSelect onChange={() => { }} loadOptions={mockLoadOptions} />);

        fireEvent.click(screen.getByRole("combobox"));

        const input = screen.getByPlaceholderText("Search Item...");
        fireEvent.change(input, { target: { value: "test" } });

        await waitFor(() => {
            expect(mockLoadOptions).toHaveBeenCalledWith("test");
        }, { timeout: 1000 });
    });

    it("displays loading state", async () => {
        const mockLoadOptions = vi.fn().mockImplementation(() => new Promise(() => { })); // Never resolves
        render(<AsyncSelect onChange={() => { }} loadOptions={mockLoadOptions} />);

        fireEvent.click(screen.getByRole("combobox"));

        // Trigger search (empty) debounce
        await waitFor(() => {
            expect(screen.getByText("Loading...")).toBeInTheDocument();
        });
    });

    it("handles load errors gracefully", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
        const mockLoadOptions = vi.fn().mockRejectedValue(new Error("Failed"));
        render(<AsyncSelect onChange={() => { }} loadOptions={mockLoadOptions} />);

        fireEvent.click(screen.getByRole("combobox"));

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("Failed to load options", expect.any(Error));
        });
        consoleSpy.mockRestore();
    });
});
