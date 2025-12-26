/**
 * Agents page - displays agent list and management
 */
export default function AgentsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Manage sales agents and device assignments
                    </p>
                </div>
            </div>

            {/* Placeholder for agent list */}
            <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
                <p className="text-zinc-500 dark:text-zinc-400">
                    Agent list will appear here
                </p>
            </div>
        </div>
    );
}
