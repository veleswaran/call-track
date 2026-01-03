import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CallLogSearch } from "./call-log-search";
import userEvent from "@testing-library/user-event";

describe("CallLogSearch", () => {
    it("renders input", () => {
        render(<CallLogSearch value="" onChange={vi.fn()} />);
        expect(screen.getByPlaceholderText("Search phone or contact...")).toBeInTheDocument();
    });

    it("calls onChange on input", async () => {
        const onChange = vi.fn();
        render(<CallLogSearch value="" onChange={onChange} />);

        const input = screen.getByPlaceholderText("Search phone or contact...");
        await userEvent.type(input, "123");

        const searchButton = screen.getByRole("button", { name: "Search" });
        await userEvent.click(searchButton);

        expect(onChange).toHaveBeenCalledWith("123");
    });

    it("triggers search on Enter key", async () => {
        const onChange = vi.fn();
        render(<CallLogSearch value="" onChange={onChange} />);

        const input = screen.getByPlaceholderText("Search phone or contact...");
        await userEvent.type(input, "123{enter}");

        expect(onChange).toHaveBeenCalledWith("123");
    });

    it("clears search input", async () => {
        const onChange = vi.fn();
        render(<CallLogSearch value="123" onChange={onChange} />);

        const clearButton = screen.getByText("Clear search");
        await userEvent.click(clearButton);

        expect(onChange).toHaveBeenCalledWith(undefined);
        expect(screen.getByPlaceholderText("Search phone or contact...")).toHaveValue("");
    });
});
