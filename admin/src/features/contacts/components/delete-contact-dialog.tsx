"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { useDeleteContact } from "@features/contacts/hooks/use-delete-contact";
import type { Contact } from "@shared/types";
import { Loader2 } from "lucide-react";

interface DeleteContactDialogProps {
    contact: Contact | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteContactDialog({ contact, open, onOpenChange }: DeleteContactDialogProps) {
    const { mutate: deleteContact, isPending } = useDeleteContact();

    const handleDelete = () => {
        if (!contact) return;

        deleteContact(contact.id, {
            onSuccess: () => {
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Contact</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete <strong>{contact?.name}</strong>? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isPending}
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
