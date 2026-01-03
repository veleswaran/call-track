import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Label } from "./label";

describe("Label", () => {
    it("renders correctly", () => {
        render(<Label>Test Label</Label>);
        expect(screen.getByText("Test Label")).toBeInTheDocument();
        expect(screen.getByText("Test Label")).toHaveClass("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
    });
});
