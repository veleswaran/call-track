import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
    it("renders correctly", () => {
        render(<Badge>Test Badge</Badge>);
        expect(screen.getByText("Test Badge")).toBeInTheDocument();
        expect(screen.getByText("Test Badge")).toHaveClass("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80");
    });

    it("renders variants", () => {
        render(<Badge variant="destructive">Destructive</Badge>);
        expect(screen.getByText("Destructive")).toHaveClass("border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80");
    });
});
