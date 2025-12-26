"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { useCreateContact } from "@features/contacts/hooks/use-create-contact";
import type { CallLog } from "@shared/types";
import { Loader2 } from "lucide-react";

interface AddContactDialogProps {
    callLog: CallLog;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddContactDialog({ callLog, open, onOpenChange }: AddContactDialogProps) {
    const [name, setName] = useState("");
    const { mutate: createContact, isPending } = useCreateContact();

    const handleSave = () => {
        if (!name.trim()) return;

        createContact({
            device_id: callLog.device_id,
            name: name,
            phone_number: callLog.phone_number,
        }, {
            onSuccess: () => {
                onOpenChange(false);
                setName("");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Contact</DialogTitle>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        Save this phone number to contacts properly.
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Phone Number</label>
                        <Input value={callLog.phone_number} disabled className="bg-zinc-100" />
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
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isPending || !name.trim()}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
