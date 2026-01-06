import { render, screen } from "@testing-library/react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "./dropdown-menu";
import { describe, it, expect } from "vitest";

describe("DropdownMenu", () => {
    it("renders content when open", () => {
        render(
            <DropdownMenu defaultOpen={true}>
                <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Label</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Item 1</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );

        expect(screen.getByText("Label")).toBeInTheDocument();
        expect(screen.getByText("Item 1")).toBeInTheDocument();
    });
});
