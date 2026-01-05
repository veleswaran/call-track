import { render, screen } from "@testing-library/react";
import { Calendar } from "./calendar";
import { describe, it, expect } from "vitest";

describe("Calendar", () => {
    it("renders", () => {
        render(<Calendar mode="single" selected={new Date()} />);
        // It renders days, e.g. today's date
        // Since we don't know today easily in test without mocking system time, checking for general structure
        expect(screen.getByRole("grid")).toBeInTheDocument();
    });

    it("allows classname override", () => {
        const { container } = render(<Calendar className="custom-class" />);
        expect(container.firstChild).toHaveClass("custom-class");
    });
});
