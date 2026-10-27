import { render, screen } from "@testing-library/react";
import { Alert, AlertDescription } from "./alert";
import { describe, it, expect } from "vitest";

describe("Alert", () => {
    it("renders default and destructive variants", () => {
        const { rerender } = render(
            <Alert>
                <AlertDescription>Default alert message</AlertDescription>
            </Alert>
        );

        expect(screen.getByRole("alert")).toHaveClass("bg-background");
        expect(screen.getByText("Default alert message")).toBeInTheDocument();

        rerender(
            <Alert variant="destructive">
                <AlertDescription>Destructive alert message</AlertDescription>
            </Alert>
        );

        expect(screen.getByRole("alert")).toHaveClass("text-red-600");
        expect(screen.getByText("Destructive alert message")).toBeInTheDocument();
    });
});
