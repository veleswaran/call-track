import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "./ConfirmDialog";
import { vi, describe, it, expect } from "vitest";

describe("ConfirmDialog", () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    const defaultProps = {
        title: "Confirm Action",
        description: "Are you sure you want to do this?",
        isOpen: true,
        onOpenChange: mockOnOpenChange,
        onConfirm: mockOnConfirm,
    };

    it("renders title and description", () => {
        render(<ConfirmDialog {...defaultProps} />);
        expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
        expect(screen.getByText(defaultProps.description)).toBeInTheDocument();
    });

    it("calls onConfirm when confirm button is clicked", () => {
        render(<ConfirmDialog {...defaultProps} confirmText="Yes, Do it" />);
        fireEvent.click(screen.getByText("Yes, Do it"));
        expect(mockOnConfirm).toHaveBeenCalled();
    });

    it("calls onOpenChange when cancel button is clicked", () => {
        render(<ConfirmDialog {...defaultProps} />);
        fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("shows processing state when loading", () => {
        render(<ConfirmDialog {...defaultProps} isLoading={true} />);
        expect(screen.getByText("Processing...")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Processing..." })).toBeDisabled();
        expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
    });

    it("renders title with destructive variant", () => {
        render(<ConfirmDialog {...defaultProps} variant="destructive" />);
        expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    });
});
