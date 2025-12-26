import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { useQueryClient } from "@tanstack/react-query";
import { Providers } from "./providers";

// Test component to verify QueryClient is available
function TestComponent() {
    const queryClient = useQueryClient();
    return <div data-testid="test">{queryClient ? "Has client" : "No client"}</div>;
}

describe("Providers", () => {
    it("should render children", () => {
        render(
            <Providers>
                <div data-testid="child">Child content</div>
            </Providers>
        );
        expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("should provide QueryClient to children", () => {
        render(
            <Providers>
                <TestComponent />
            </Providers>
        );
        expect(screen.getByTestId("test")).toHaveTextContent("Has client");
    });

    it("should render multiple children", () => {
        render(
            <Providers>
                <div data-testid="child1">First</div>
                <div data-testid="child2">Second</div>
            </Providers>
        );
        expect(screen.getByTestId("child1")).toBeInTheDocument();
        expect(screen.getByTestId("child2")).toBeInTheDocument();
    });
});
