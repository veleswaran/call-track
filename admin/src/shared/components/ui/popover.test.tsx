import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

describe("Popover", () => {
    it("renders trigger and content", () => {
        render(
            <Popover>
                <PopoverTrigger>Open</PopoverTrigger>
                <PopoverContent>Content</PopoverContent>
            </Popover>
        );

        const trigger = screen.getByText("Open");
        expect(trigger).toBeInTheDocument();

        fireEvent.click(trigger);
        expect(screen.getByText("Content")).toBeInTheDocument();
    });
});
