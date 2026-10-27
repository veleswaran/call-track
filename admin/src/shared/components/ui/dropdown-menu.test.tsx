import { render, screen } from "@testing-library/react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuGroup,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuRadioGroup,
} from "./dropdown-menu";
import { describe, it, expect } from "vitest";

describe("DropdownMenu", () => {
    it("renders content when open", () => {
        render(
            <DropdownMenu defaultOpen={true}>
                <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuGroup>
                        <DropdownMenuLabel inset>Label</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem inset>Item 1</DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuRadioGroup value="opt1">
                        <DropdownMenuItem>Option 1</DropdownMenuItem>
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSub defaultOpen={true}>
                        <DropdownMenuSubTrigger inset>Sub trigger</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem>Sub item</DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>
        );

        expect(screen.getByText("Label")).toBeInTheDocument();
        expect(screen.getByText("Item 1")).toBeInTheDocument();
        expect(screen.getByText("Sub trigger")).toBeInTheDocument();
    });
});
