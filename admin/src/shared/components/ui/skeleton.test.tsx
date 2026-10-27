import { render } from "@testing-library/react";
import { Skeleton } from "./skeleton";
import { describe, it, expect } from "vitest";

describe("Skeleton", () => {
    it("renders skeleton component with classes", () => {
        const { container } = render(<Skeleton className="h-4 w-12" />);
        expect(container.firstChild).toHaveClass("animate-pulse", "rounded-md", "bg-muted", "h-4", "w-12");
    });
});
