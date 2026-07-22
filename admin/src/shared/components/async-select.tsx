"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { cn } from "@shared/utils";
import { Button } from "@shared/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@shared/components/ui/popover";
import { Input } from "@shared/components/ui/input";

export interface Option {
    label: string;
    value: string;
}

interface AsyncSelectProps {
    value?: string;
    onChange: (value: string) => void;
    loadOptions: (search: string) => Promise<Option[]>;
    placeholder?: string;
    label?: string;
    className?: string;
}

export function AsyncSelect({
    value,
    onChange,
    loadOptions,
    placeholder = "Select item...",
    label = "Item",
    className,
}: AsyncSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [options, setOptions] = React.useState<Option[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const [selectedLabel, setSelectedLabel] = React.useState<string>("");

    const fetchOptions = React.useCallback(async (query: string) => {
        setLoading(true);
        try {
            const data = await loadOptions(query);
            setOptions(data);
        } catch (error) {
            console.error("Failed to load options", error);
        } finally {
            setLoading(false);
        }
    }, [loadOptions]);

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            fetchOptions(search);
        }, 300);

        return () => clearTimeout(timer);
    }, [search, fetchOptions]);

    // Update selected label when value changes
    React.useEffect(() => {
        if (!value) {
            setSelectedLabel("");
            return;
        }
        // If option is in current list, use it
        const option = options.find((opt) => opt.value === value);
        if (option) {
            setSelectedLabel(option.label);
        }
        // If not in list (e.g. initial load), we might need to fetch it or accept it's missing label until list loads
        // Ideally we should have a way to fetch label for initial value, but for now we rely on list or placeholder.
        // However, for filters, usually we want to show the selected item.
        // Improvement: accept `initialLabel` or fetching single item logic.
        // For now, simple implementation.
    }, [value, options]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-[200px] justify-between", className)}
                >
                    {selectedLabel || (value && value !== "all") ? (selectedLabel || options.find(o => o.value === value)?.label || value) : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent 
                className="w-[var(--radix-popover-trigger-width)] p-0 pointer-events-auto"
            >
                <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <Input
                        placeholder={`Search ${label}...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={cn(
                            "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        )}
                    />
                </div>
                <div className="max-h-[300px] overflow-y-auto overscroll-contain p-1" onWheel={(e) => e.stopPropagation()}>
                    {loading && (
                        <div className="py-6 text-center text-sm">
                            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                            <span className="sr-only">Loading...</span>
                        </div>
                    )}
                    {!loading && options.length === 0 && (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            No {label.toLowerCase()} found.
                        </div>
                    )}
                    {!loading &&
                        options.map((option, index) => (
                            <div
                                key={option.value || `option-${index}`}
                                className={cn(
                                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                    value === option.value && "bg-accent text-accent-foreground"
                                )}
                                onClick={() => {
                                    onChange(option.value);
                                    setOpen(false);
                                    setSelectedLabel(option.label);
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === option.value ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {option.label}
                            </div>
                        ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
