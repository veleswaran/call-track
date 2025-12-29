"use client";

import { useState } from "react";
import { useContacts } from "@features/contacts/hooks/use-contacts";

export function ContactsList() {
    const [page, setPage] = useState(1);
    const { data, isLoading, isError } = useContacts({ page, per_page: 15 });

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

    const { current_page, last_page } = data.meta;

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
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-500">
                    Page {current_page} of {last_page}
                </p>
                <div className="flex gap-2">
                    <button
                        className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={current_page <= 1}
                    >
                        Previous
                    </button>
                    <button
                        className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
                        onClick={() => setPage((p) => Math.min(last_page, p + 1))}
                        disabled={current_page >= last_page}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
