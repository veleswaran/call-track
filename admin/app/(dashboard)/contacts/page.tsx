"use client";

/**
 * Contacts page - displays saved contacts from calls
 */
import { useState } from "react";
import { ContactsList } from "@features/contacts/components/contacts-list";
import { AddContactDialog } from "@features/contacts/components/add-contact-dialog";
import { Button } from "@shared/components/ui/button";
import { Plus } from "lucide-react";

export default function ContactsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Saved contacts from call logs
                    </p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Contact
                </Button>
            </div>

            <ContactsList />

            <AddContactDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />
        </div>
    );
}
