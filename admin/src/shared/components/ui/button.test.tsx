import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, buttonVariants } from "./button";

describe("Button", () => {
    it("should render with default variant and size", () => {
        render(<Button>Click me</Button>);
        const button = screen.getByRole("button", { name: "Click me" });
        expect(button).toBeInTheDocument();
    });

    it("should apply custom className", () => {
        render(<Button className="custom-class">Click me</Button>);
        const button = screen.getByRole("button");
        expect(button).toHaveClass("custom-class");
    });

    it("should handle click events", async () => {
        const user = userEvent.setup();
        let clicked = false;
        render(<Button onClick={() => (clicked = true)}>Click me</Button>);

        await user.click(screen.getByRole("button"));
        expect(clicked).toBe(true);
    });

    it("should be disabled when disabled prop is true", () => {
        render(<Button disabled>Click me</Button>);
        const button = screen.getByRole("button");
        expect(button).toBeDisabled();
    });

    it("should render destructive variant", () => {
        render(<Button variant="destructive">Delete</Button>);
        const button = screen.getByRole("button");
        expect(button).toHaveClass("bg-red-500");
    });

    it("should render outline variant", () => {
        render(<Button variant="outline">Outline</Button>);
        const button = screen.getByRole("button");
        expect(button).toHaveClass("border");
    });

    it("should render secondary variant", () => {
        render(<Button variant="secondary">Secondary</Button>);
        const button = screen.getByRole("button");
        expect(button).toHaveClass("bg-zinc-100");
    });

    it("should render ghost variant", () => {
        render(<Button variant="ghost">Ghost</Button>);
        const button = screen.getByRole("button");
        expect(button).toHaveClass("hover:bg-zinc-100");
    });

    it("should render link variant", () => {
        render(<Button variant="link">Link</Button>);
        const button = screen.getByRole("button");
        expect(button).toHaveClass("underline-offset-4");
    });

    it("should render small size", () => {
        render(<Button size="sm">Small</Button>);
        const button = screen.getByRole("button");
        expect(button).toHaveClass("h-8");
    });

    it("should render large size", () => {
        render(<Button size="lg">Large</Button>);
        const button = screen.getByRole("button");
        expect(button).toHaveClass("h-10");
    });

    it("should render icon size", () => {
        render(<Button size="icon">🔍</Button>);
        const button = screen.getByRole("button");
        expect(button).toHaveClass("h-9", "w-9");
    });

    it("should forward ref", () => {
        const ref = { current: null as HTMLButtonElement | null };
        render(<Button ref={ref}>Click me</Button>);
        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it("should pass through native button props", () => {
        render(
            <Button type="submit" name="submit-btn">
                Submit
            </Button>
        );
        const button = screen.getByRole("button");
        expect(button).toHaveAttribute("type", "submit");
        expect(button).toHaveAttribute("name", "submit-btn");
    });
});

describe("buttonVariants", () => {
    it("should return default classes when no variants specified", () => {
        const classes = buttonVariants();
        expect(classes).toContain("bg-zinc-900");
        expect(classes).toContain("h-9");
    });

    it("should return variant-specific classes", () => {
        const classes = buttonVariants({ variant: "destructive" });
        expect(classes).toContain("bg-red-500");
    });

    it("should return size-specific classes", () => {
        const classes = buttonVariants({ size: "lg" });
        expect(classes).toContain("h-10");
    });
});
