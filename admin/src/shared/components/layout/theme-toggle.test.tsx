import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "./theme-toggle";
import { useTheme } from "next-themes";
import { describe, it, expect, vi } from "vitest";

vi.mock("next-themes", () => ({
    useTheme: vi.fn(),
}));

describe("ThemeToggle", () => {
    it("toggles from light to dark theme on click", () => {
        const setTheme = vi.fn();
        vi.mocked(useTheme).mockReturnValue({
            theme: "light",
            setTheme,
        } as unknown as ReturnType<typeof useTheme>);

        render(<ThemeToggle />);
        const button = screen.getByRole("button", { name: /toggle theme/i });
        fireEvent.click(button);

        expect(setTheme).toHaveBeenCalledWith("dark");
    });

    it("toggles from dark to light theme on click", () => {
        const setTheme = vi.fn();
        vi.mocked(useTheme).mockReturnValue({
            theme: "dark",
            setTheme,
        } as unknown as ReturnType<typeof useTheme>);

        render(<ThemeToggle />);
        const button = screen.getByRole("button", { name: /toggle theme/i });
        fireEvent.click(button);

        expect(setTheme).toHaveBeenCalledWith("light");
    });
});
