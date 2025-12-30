"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@shared/components/ui/dialog";
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
    /**
     * Device ID to associate contact with
     * Required when callLog is not provided
     */
    deviceId?: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddContactDialog({ callLog, deviceId, open, onOpenChange }: AddContactDialogProps) {
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const { mutate: createContact, isPending } = useCreateContact();

    // Determine if we're in standalone mode (no call log provided)
    const isStandaloneMode = !callLog;
    const effectiveDeviceId = callLog?.device_id ?? deviceId ?? 1; // Default to device 1 if not provided
    const effectivePhoneNumber = callLog?.phone_number ?? phoneNumber;

    const handleSave = () => {
        if (!name.trim() || (!isStandaloneMode && !callLog) || (isStandaloneMode && !phoneNumber.trim())) {
            return;
        }

        createContact({
            device_id: effectiveDeviceId,
            name: name.trim(),
            phone_number: effectivePhoneNumber,
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
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        {isStandaloneMode
                            ? "Create a new contact entry"
                            : "Save this phone number to contacts properly"}
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Phone Number</label>
                        {isStandaloneMode ? (
                            <Input
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="+1234567890"
                            />
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
