"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { useCreateContact } from "@features/contacts/hooks/use-create-contact";
import type { CallLog } from "@shared/types";
import { Loader2 } from "lucide-react";

interface AddContactDialogProps {
    /**
     * Optional call log to pre-fill phone number from
     * If not provided, dialog works in standalone mode
     */
    callLog?: CallLog;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddContactDialog({ callLog, open, onOpenChange }: AddContactDialogProps) {
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const { mutate: createContact, isPending } = useCreateContact();

    // Determine if we're in standalone mode (no call log provided)
    const isStandaloneMode = !callLog;
    const effectivePhoneNumber = callLog?.phone_number ?? phoneNumber;

    const handleSave = () => {
        if (!name.trim() || (isStandaloneMode && !phoneNumber.trim())) {
            return;
        }

        createContact({
            name: name.trim(),
            phone_number: isStandaloneMode ? `+91${phoneNumber.trim()}` : effectivePhoneNumber,
        }, {
            onSuccess: () => {
                onOpenChange(false);
                setName("");
                setPhoneNumber("");
            }
        });
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            // Reset form when closing
            setName("");
            setPhoneNumber("");
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Contact</DialogTitle>
                    <DialogDescription>
                        {isStandaloneMode
                            ? "Create a new contact entry"
                            : "Save this phone number to contacts properly"}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Phone Number</label>
                        {isStandaloneMode ? (
                            <div className="flex">
                                <span className="inline-flex items-center rounded-l-md border border-r-0 border-zinc-200 bg-zinc-100 px-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
                                    +91
                                </span>
                                <Input
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="9876543210"
                                    className="rounded-l-none"
                                />
                            </div>
                        ) : (
                            <Input value={callLog?.phone_number} disabled className="bg-zinc-100 dark:bg-zinc-800" />
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>Cancel</Button>
                    <Button
                        onClick={handleSave}
                        disabled={isPending || !name.trim() || (isStandaloneMode && !phoneNumber.trim())}
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
