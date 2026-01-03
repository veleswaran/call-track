import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "./dialog";

describe("Dialog", () => {
    it("renders and opens", () => {
        render(
            <Dialog>
                <DialogTrigger>Open Dialog</DialogTrigger>
                <DialogContent>
                    <DialogTitle>Dialog Title</DialogTitle>
                    <DialogDescription>Dialog Description</DialogDescription>
                </DialogContent>
            </Dialog>
        );

        const trigger = screen.getByText("Open Dialog");
        expect(trigger).toBeInTheDocument();

        fireEvent.click(trigger);
        expect(screen.getByText("Dialog Title")).toBeInTheDocument();
        expect(screen.getByText("Dialog Description")).toBeInTheDocument();
    });
});
