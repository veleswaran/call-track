import { render, screen, fireEvent } from "@testing-library/react";
import { DeleteTeamDialog } from "./DeleteTeamDialog";
import { vi, describe, it, expect } from "vitest";

describe("DeleteTeamDialog", () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    const defaultProps = {
        teamName: "Alpha Team",
        isOpen: true,
        onOpenChange: mockOnOpenChange,
        onConfirm: mockOnConfirm,
        isDeleting: false,
    };

    it("renders team name in description", () => {
        render(<DeleteTeamDialog {...defaultProps} />);
        expect(screen.getByText(/Alpha Team/)).toBeInTheDocument();
    });

    it("calls onConfirm when delete button is clicked", () => {
        render(<DeleteTeamDialog {...defaultProps} />);
        fireEvent.click(screen.getByRole("button", { name: "Delete Team" }));
        expect(mockOnConfirm).toHaveBeenCalled();
    });

    it("shows deleting state", () => {
        render(<DeleteTeamDialog {...defaultProps} isDeleting={true} />);
        expect(screen.getByText("Deleting...")).toBeInTheDocument();
        expect(screen.getByText("Deleting...")).toBeDisabled();
        expect(screen.getByText("Cancel")).toBeDisabled();
    });
});
