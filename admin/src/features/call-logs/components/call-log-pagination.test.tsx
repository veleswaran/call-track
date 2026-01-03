import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CallLogPagination } from "./call-log-pagination";

describe("CallLogPagination", () => {
    it("renders pagination controls", () => {
        render(
            <CallLogPagination
                page={1}
                perPage={15}
                total={45}
                onChange={vi.fn()}
            />
        );

        expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
        expect(screen.getByRole("button", { name: /next/i })).toBeEnabled();
    });

    it("calls onChange on interaction", () => {
        const onChange = vi.fn();
        render(
            <CallLogPagination
                page={2}
                perPage={15}
                total={45} // 3 pages
                onChange={onChange}
            />
        );

        // Next
        fireEvent.click(screen.getByRole("button", { name: /go to next page/i }));
        expect(onChange).toHaveBeenLastCalledWith(3, 15);

        // Previous
        fireEvent.click(screen.getByRole("button", { name: /go to previous page/i }));
        expect(onChange).toHaveBeenLastCalledWith(1, 15);

        // First
        fireEvent.click(screen.getByRole("button", { name: /go to first page/i }));
        expect(onChange).toHaveBeenLastCalledWith(1, 15);

        // Last
        fireEvent.click(screen.getByRole("button", { name: /go to last page/i }));
        expect(onChange).toHaveBeenLastCalledWith(3, 15);
    });
});
