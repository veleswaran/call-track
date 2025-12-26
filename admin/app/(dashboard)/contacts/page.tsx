/**
 * Contacts page - displays saved contacts from calls
 */
export default function ContactsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Saved contacts from call logs
                    </p>
                </div>
            </div>

            {/* Placeholder for contacts list */}
            <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
                <p className="text-zinc-500 dark:text-zinc-400">
                    Contacts list will appear here
                </p>
            </div>
        </div>
    );
}
