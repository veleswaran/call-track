"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { useClassifyCall } from "../hooks/use-classify-call";
import type { CallLog, CallClassificationType } from "@shared/types";
import { Loader2 } from "lucide-react";

interface CallClassificationDialogProps {
    callLog: CallLog;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CallClassificationDialog({ callLog, open, onOpenChange }: CallClassificationDialogProps) {
    const [selectedType, setSelectedType] = useState<CallClassificationType>(callLog.classification?.classification ?? "business");
    const { mutate: classify, isPending } = useClassifyCall();

    const handleSave = () => {
        classify({ id: callLog.id, type: selectedType }, {
            onSuccess: () => {
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Classify Call</DialogTitle>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        Select a category for this call log.
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                            <input
                                type="radio"
                                name="classification"
                                value="business"
                                checked={selectedType === "business"}
                                onChange={() => setSelectedType("business")}
                                className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Business</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="radio"
                                name="classification"
                                value="personal"
                                checked={selectedType === "personal"}
                                onChange={() => setSelectedType("personal")}
                                className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Personal</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="radio"
                                name="classification"
                                value="ignored"
                                checked={selectedType === "ignored"}
                                onChange={() => setSelectedType("ignored")}
                                className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Ignored</span>
                        </label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
