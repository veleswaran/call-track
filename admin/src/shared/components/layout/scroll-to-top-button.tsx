"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@shared/utils";

/**
 * ScrollToTopButton
 * 
 * A fixed-position circular button that only appears when the user 
 * has scrolled down a certain amount.
 */
export function ScrollToTopButton() {
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        const toggleVisibility = () => {
            setIsVisible(window.scrollY > 300);
        };

        // Use { passive: true } for better scroll performance as we don't call preventDefault.
        window.addEventListener("scroll", toggleVisibility, { passive: true });

        // Immediately check visibility on mount in case the page is already scrolled.
        toggleVisibility();

        return () => {
            window.removeEventListener("scroll", toggleVisibility);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <button
            type="button"
            onClick={scrollToTop}
            className={cn(
                "fixed bottom-24 right-6 z-50 p-3 rounded-full bg-zinc-900 border border-zinc-800 text-white shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 group md:bottom-10",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
            )}
            aria-label="Scroll to top"
        >
            <ArrowUp className="h-5 w-5 transition-transform group-hover:-translate-y-1" />
        </button>
    );
}
