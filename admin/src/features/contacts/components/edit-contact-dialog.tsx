"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { useUpdateContact } from "@features/contacts/hooks/use-update-contact";
import type { Contact } from "@shared/types";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@shared/components/ui/checkbox";

interface EditContactDialogProps {
    contact: Contact | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditContactDialog({ contact, open, onOpenChange }: EditContactDialogProps) {
    const [name, setName] = useState(contact?.name || "");
    const [phoneNumber, setPhoneNumber] = useState(contact?.phone_number || "");
    const [isInternal, setIsInternal] = useState(contact?.is_internal ?? true);
    const { mutate: updateContact, isPending } = useUpdateContact();

    // Removed useEffect. Parent component must conditionally render this dialog
    // so it mounts fresh for each contact.

    const handleSave = () => {
        if (!contact || !name.trim() || !phoneNumber.trim()) {
            return;
        }

        updateContact({
            id: contact.id,
            data: {
                name: name.trim(),
                phone_number: phoneNumber.trim(),
                is_internal: isInternal,
            },
        }, {
            onSuccess: () => {
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Contact</DialogTitle>
                    <DialogDescription>
                        Update the contact information for this person.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Phone Number</label>
                        <Input
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+1234567890"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="edit_is_internal"
                            checked={isInternal}
                            onCheckedChange={(checked) => setIsInternal(!!checked)}
                        />
                        <label
                            htmlFor="edit_is_internal"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                            Internal Contact
                        </label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
                    <Button
                        onClick={handleSave}
                        disabled={isPending || !name.trim() || !phoneNumber.trim()}
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
