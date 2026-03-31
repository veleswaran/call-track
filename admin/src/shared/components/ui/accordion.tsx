"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@shared/utils";

const Accordion = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("divide-y divide-zinc-200 dark:divide-zinc-800 border-zinc-200 dark:border-zinc-800", className)}
        {...props}
    />
));
Accordion.displayName = "Accordion";

const AccordionItem = React.forwardRef<
    HTMLDivElement,
    { title: string; children: React.ReactNode; defaultOpen?: boolean } & React.HTMLAttributes<HTMLDivElement>
>(({ title, children, defaultOpen = false, className, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);

    return (
        <div ref={ref} className={cn("group", className)} {...props}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180"
                data-state={isOpen ? "open" : "closed"}
            >
                {title}
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </button>
            <div
                className={cn(
                    "overflow-hidden text-sm transition-all duration-200",
                    isOpen ? "max-h-[1000px] opacity-100 pb-4" : "max-h-0 opacity-0"
                )}
            >
                {children}
            </div>
        </div>
    );
});
AccordionItem.displayName = "AccordionItem";

export { Accordion, AccordionItem };
