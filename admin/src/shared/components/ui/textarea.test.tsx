import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Textarea } from "./textarea";

describe("Textarea", () => {
    it("renders correctly", () => {
        render(<Textarea placeholder="Enter text" />);
        const textarea = screen.getByPlaceholderText("Enter text");
        expect(textarea).toBeInTheDocument();
        expect(textarea).toHaveClass("flex min-h-[80px] w-full rounded-md border");
    });

    it("accepts ref", () => {
        const ref = { current: null };
        render(<Textarea ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });
});
