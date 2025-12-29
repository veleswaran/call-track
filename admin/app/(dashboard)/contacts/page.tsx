/**
 * Contacts page - displays saved contacts from calls
 */
import { ContactsList } from "@features/contacts/components/contacts-list";

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

            <ContactsList />
        </div>
    );
}
