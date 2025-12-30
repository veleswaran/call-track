"use client";

import { Input } from "@shared/components/ui/input";
import { Button } from "@shared/components/ui/button"; // Import Button
import { Search, X } from "lucide-react";
import { useState } from "react";
// Remove useDebounce import

interface CallLogSearchProps {
    value?: string;
    onChange: (value: string | undefined) => void;
}

export function CallLogSearch({ value, onChange }: CallLogSearchProps) {
    const [searchTerm, setSearchTerm] = useState(value ?? "");
    const [prevValue, setPrevValue] = useState(value);

    // Derived state from props: Sync prop changes to local state
    if (value !== prevValue) {
        setPrevValue(value);
        setSearchTerm(value ?? "");
    }

    // Remove useDebounce and useEffect that called onChange

    const handleSearch = () => {
        onChange(searchTerm || undefined);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const handleClear = () => {
        setSearchTerm("");
        onChange(undefined);
    };

    return (
        <div className="relative flex w-full max-w-sm items-center gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <Input
                    type="search"
                    placeholder="Search phone or contact..."
                    className="pl-9 pr-8 [&::-webkit-search-cancel-button]:appearance-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                {searchTerm && (
                    <button
                        onClick={handleClear}
                        className="absolute right-2 top-2 rounded-sm p-0.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Clear search</span>
                    </button>
                )}
            </div>
            <Button onClick={handleSearch} variant="secondary">
                Search
            </Button>
        </div>
    );
}
