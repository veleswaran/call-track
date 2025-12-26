/**
 * Devices page - displays device list with status indicators
 */
export default function DevicesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Devices</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Manage registered devices and their assignments
                    </p>
                </div>
            </div>

            {/* Placeholder for device list */}
            <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
                <p className="text-zinc-500 dark:text-zinc-400">
                    Device list will appear here
                </p>
            </div>
        </div>
    );
}
