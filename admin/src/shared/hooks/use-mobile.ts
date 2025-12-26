"use client";

import * as React from "react";

const MOBILE_BREAKPOINT = 768; // md breakpoint in Tailwind

/**
 * Hook to detect if the current viewport is mobile
 * Returns true when viewport width is less than md breakpoint (768px)
 */
export function useMobile(): boolean {
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };

        // Check on mount
        checkMobile();

        // Listen for resize
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    return isMobile;
}

export { MOBILE_BREAKPOINT };
