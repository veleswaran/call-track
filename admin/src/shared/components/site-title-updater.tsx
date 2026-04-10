"use client";

import { useEffect, useRef } from "react";
import { useSettingsQuery } from "@/src/features/settings/hooks/use-settings";

export function SiteTitleUpdater() {
    const { data: settings } = useSettingsQuery();
    const sitename = settings?.app_sitename;
    
    // Track the site name we last injected so we can replace it dynamically 
    // if the user changes settings without reloading the page.
    const lastInjectedSitename = useRef<string | null>(null);

    useEffect(() => {
        if (!sitename) return;

        const updateTitle = () => {
            const titleTag = document.querySelector("title");
            if (!titleTag) return;

            const currentText = titleTag.textContent || "";
            let newText = currentText;

            const defaultNames = ["CallTrack AI Admin", "CallTrack Admin", "CallTrack AI"];

            // 1. Next.js might have re-rendered the default exact title
            for (const defaultName of defaultNames) {
                if (newText.includes(defaultName)) {
                    newText = newText.replace(defaultName, sitename);
                }
            }

            // 2. If user just dynamically updated the sitename (e.g. settings page)
            // Replace the OLD dynamic name with the NEW dynamic name
            const oldSitename = lastInjectedSitename.current;
            if (oldSitename && oldSitename !== sitename && newText.includes(oldSitename)) {
                newText = newText.replace(oldSitename, sitename);
            }

            // Apply changes
            if (currentText !== newText) {
                titleTag.textContent = newText;
            }
            
            // Sync ref for the next mutation
            lastInjectedSitename.current = sitename;
        };

        // Apply immediately for current render
        updateTitle();

        // Next.js swaps `<title>` nodes when navigating, so watching `document.title` or `head` is necessary
        const targetNode = document.querySelector("head");
        if (!targetNode) return;

        let isUpdating = false;
        const observer = new MutationObserver(() => {
            if (isUpdating) return;
            isUpdating = true;
            updateTitle();
            isUpdating = false;
        });

        // Watch for any changes in the head (like a new title element) or title text changes
        observer.observe(targetNode, { childList: true, subtree: true, characterData: true });

        return () => observer.disconnect();
    }, [sitename]);

    return null;
}
