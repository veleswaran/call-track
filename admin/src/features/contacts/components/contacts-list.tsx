"use client";

import { useEffect, useState } from "react";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import { EditContactDialog } from "./edit-contact-dialog";
import { DeleteContactDialog } from "./delete-contact-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { Button } from "@shared/components/ui/button";
import { MoreVertical, Pencil, Trash } from "lucide-react";
import type { Contact } from "@shared/types";
import { useAuth } from "@features/auth/hooks/use-auth";
import { CallLogPagination } from "@features/call-logs/components/call-log-pagination";
import { Badge } from "@shared/components/ui/badge";

export function ContactsList({ search }: { search?: string }) {
    const { user } = useAuth(); // RBAC
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);

    const [prevSearch, setPrevSearch] = useState(search);

    // Reset page on search by updating during render
    if (search !== prevSearch) {
        setPrevSearch(search);
        setPage(1);
    }

    const { data, isLoading, isError } = useContacts({ 
        page, 
        per_page: perPage,
        search 
    });
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
    const handleEdit = (contact: Contact) => {
        setEditingContact(contact);
    };

    const handleDelete = (contact: Contact) => {
        setDeletingContact(contact);
    };


    if (isLoading) {
        return (
            <div className="rounded-md border p-6 text-sm text-zinc-500 dark:text-zinc-400">
                Loading contacts...
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="rounded-md border p-6 text-sm text-red-600 dark:text-red-400">
                Failed to load contacts. Please try again.
            </div>
        );
    }

    if (!data.data.length) {
        return (
            <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
                <p className="text-zinc-500 dark:text-zinc-400">No contacts found.</p>
            </div>
        );
    }

    const { total } = data.meta;

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto rounded-md border">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/40">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                                Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                                Phone
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                                Created
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                                Type
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
                        {data.data.map((c) => (
                            <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                                <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                    {c.name}
                                </td>
                                <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                                    {c.phone_number}
                                </td>
                                <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                                    {new Date(c.created_at).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {c.is_internal ? (
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none shadow-none">Internal</Badge>
                                    ) : (
                                        <Badge className="bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-none shadow-none">External</Badge>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right text-sm">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(c)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            {user?.roles?.some(role => ['super-admin', 'admin'].includes(role)) && (
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(c)}
                                                    className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                                >
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="py-2 border-t border-zinc-200 dark:border-zinc-800">
                <CallLogPagination
                    page={page}
                    perPage={perPage}
                    total={total}
                    onChange={(p, pp) => {
                        setPage(p);
                        setPerPage(pp);
                    }}
                />
            </div>

            {editingContact && (
                <EditContactDialog
                    contact={editingContact}
                    open={!!editingContact}
                    onOpenChange={(open) => !open && setEditingContact(null)}
                />
            )}

            {deletingContact && (
                <DeleteContactDialog
                    contact={deletingContact}
                    open={!!deletingContact}
                    onOpenChange={(open) => !open && setDeletingContact(null)}
                />
            )}
        </div>
    );
}
