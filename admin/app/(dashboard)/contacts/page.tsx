"use client";

/**
 * Contacts page - displays saved contacts from calls
 */
import { useEffect, useState } from "react";
import { ContactsList } from "@features/contacts/components/contacts-list";
import { AddContactDialog } from "@features/contacts/components/add-contact-dialog";
import { Button } from "@shared/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@shared/components/ui/input";

export default function ContactsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce search input to prevent excessive API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

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

            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search contacts..."
                    className="pl-9 max-w-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <ContactsList search={debouncedSearch} />

            <AddContactDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />
        </div>
    );
}
