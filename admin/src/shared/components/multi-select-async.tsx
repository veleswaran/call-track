"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react";
import { cn } from "@shared/utils";
import { Button } from "@shared/components/ui/button";
import { Badge } from "@shared/components/ui/badge";
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

interface MultiSelectAsyncProps {
    value: string[];
    onChange: (value: string[]) => void;
    loadOptions: (search: string) => Promise<Option[]>;
    placeholder?: string;
    label?: string;
    className?: string;
    emptyText?: string;
}

export function MultiSelectAsync({
    value = [],
    onChange,
    loadOptions,
    placeholder = "Select items...",
    label = "Items",
    className,
    emptyText = "No items found.",
}: MultiSelectAsyncProps) {
    const [open, setOpen] = React.useState(false);
    const [options, setOptions] = React.useState<Option[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const labelCache = React.useRef<Record<string, string>>({});

    const fetchOptions = React.useCallback(async (query: string) => {
        setLoading(true);
        try {
            const results = await loadOptions(query);
            setOptions(results);
            
            // Update label cache
            results.forEach(opt => {
                labelCache.current[opt.value] = opt.label;
            });
        } catch (error) {
            console.error("Failed to fetch options:", error);
        } finally {
            setLoading(false);
        }
    }, [loadOptions]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            fetchOptions(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, fetchOptions]);

    const handleSelect = (optionValue: string) => {
        if (optionValue === "all") {
            onChange([]);
            setOpen(false);
            return;
        }

        const newValues = value.includes(optionValue)
            ? value.filter((v) => v !== optionValue)
            : [...value, optionValue];
        
        onChange(newValues);
    };

    const removeValue = (e: React.BaseSyntheticEvent, val: string) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(value.filter((v) => v !== val));
    };

    // Filter options to get only selected ones for display
    const visibleSelectedValue = value.filter(v => v !== 'all').slice(0, 1);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("h-10 w-full justify-between items-center px-3 py-0", className)}
                >
                    <div className="flex items-center justify-between w-full gap-1 overflow-hidden">
                        <div className="flex items-center gap-1 overflow-hidden min-w-0 flex-1 text-left">
                            {value.length > 0 && !(value.length === 1 && value[0] === 'all') ? (
                                <div className="flex items-center gap-1 overflow-hidden flex-1 min-w-0">
                                    {visibleSelectedValue.map((v) => {
                                        const option = options.find((o) => o.value === v);
                                        const labelText = option ? option.label : (labelCache.current[v] || v);
                                        return (
                                            <Badge
                                                key={v}
                                                variant="secondary"
                                                className="h-6 flex-shrink-0 gap-1 px-1.5 bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-900 font-medium rounded-md whitespace-nowrap min-w-0"
                                            >
                                                <span className="truncate max-w-[40px] sm:max-w-[55px]">
                                                    {labelText}
                                                </span>
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    className="ring-offset-background rounded-full outline-none hover:bg-zinc-300 p-0.5 transition-colors cursor-pointer"
                                                    onClick={(e) => removeValue(e, v)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') removeValue(e, v); }}
                                                >
                                                    <X className="h-3 w-3 text-zinc-500" />
                                                </div>
                                            </Badge>
                                        );
                                    })}
                                    {value.filter(v => v !== 'all').length > 1 && (
                                        <Badge variant="outline" className="h-6 bg-zinc-50 text-zinc-500 border-zinc-200 px-1 font-normal whitespace-nowrap flex-shrink-0">
                                            +{value.filter(v => v !== 'all').length - 1} more
                                        </Badge>
                                    )}
                                </div>
                            ) : (
                                <span className="text-sm truncate">
                                    {placeholder}
                                </span>
                            )}
                        </div>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <div className="flex flex-col">
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Input
                            placeholder={`Search ${label}...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
                        {loading && (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin opacity-50" />
                            </div>
                        )}
                        {!loading && options.length === 0 && (
                            <div className="py-6 text-center text-sm text-muted-foreground">{emptyText}</div>
                        )}
                        {!loading && options.map((option, index) => (
                            <div
                                key={option.value || `option-${index}`}
                                className={cn(
                                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors",
                                    value.includes(option.value) && "bg-accent/50 font-medium"
                                )}
                                onClick={() => handleSelect(option.value)}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value.includes(option.value) ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {option.label}
                            </div>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
