import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./input";

describe("Input", () => {
    it("should render with default type", () => {
        render(<Input placeholder="Enter text" />);
        const input = screen.getByPlaceholderText("Enter text");
        expect(input).toBeInTheDocument();
        // HTML inputs default to text when type is not explicitly set
        expect(input.tagName).toBe("INPUT");
    });

    it("should render with custom type", () => {
        render(<Input type="password" placeholder="Password" />);
        const input = screen.getByPlaceholderText("Password");
        expect(input).toHaveAttribute("type", "password");
    });

    it("should apply custom className", () => {
        render(<Input className="custom-class" />);
        const input = screen.getByRole("textbox");
        expect(input).toHaveClass("custom-class");
    });

    it("should handle value changes", async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();
        render(<Input onChange={handleChange} />);

        const input = screen.getByRole("textbox");
        await user.type(input, "test");

        expect(handleChange).toHaveBeenCalled();
    });

    it("should be disabled when disabled prop is true", () => {
        render(<Input disabled />);
        const input = screen.getByRole("textbox");
        expect(input).toBeDisabled();
    });

    it("should forward ref", () => {
        const ref = { current: null as HTMLInputElement | null };
        render(<Input ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it("should accept email type", () => {
        render(<Input type="email" placeholder="Email" />);
        const input = screen.getByPlaceholderText("Email");
        expect(input).toHaveAttribute("type", "email");
    });

    it("should accept number type", () => {
        render(<Input type="number" placeholder="Number" />);
        const input = screen.getByPlaceholderText("Number");
        expect(input).toHaveAttribute("type", "number");
    });

    it("should pass through native input props", () => {
        render(<Input name="test-input" required maxLength={50} />);
        const input = screen.getByRole("textbox");
        expect(input).toHaveAttribute("name", "test-input");
        expect(input).toHaveAttribute("required");
        expect(input).toHaveAttribute("maxLength", "50");
    });

    it("should show placeholder text", () => {
        render(<Input placeholder="Enter your name" />);
        expect(screen.getByPlaceholderText("Enter your name")).toBeInTheDocument();
    });
});
