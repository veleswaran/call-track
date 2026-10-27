import { render, screen, fireEvent } from "@testing-library/react";
import { Accordion, AccordionItem } from "./accordion";
import { describe, it, expect } from "vitest";

describe("Accordion", () => {
    it("renders accordion and toggles accordion item", () => {
        render(
            <Accordion>
                <AccordionItem title="Item 1" defaultOpen={false}>
                    <div>Content 1</div>
                </AccordionItem>
                <AccordionItem title="Item 2" defaultOpen={true}>
                    <div>Content 2</div>
                </AccordionItem>
            </Accordion>
        );

        expect(screen.getByText("Item 1")).toBeInTheDocument();
        expect(screen.getByText("Item 2")).toBeInTheDocument();
        expect(screen.getByText("Content 2")).toBeInTheDocument();

        const trigger1 = screen.getByText("Item 1");
        fireEvent.click(trigger1);
        expect(trigger1).toHaveAttribute("data-state", "open");

        fireEvent.click(trigger1);
        expect(trigger1).toHaveAttribute("data-state", "closed");
    });
});
