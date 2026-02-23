import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@shared/components/ui/dialog";
import { Device } from "@shared/types";
import { Button } from "@shared/components/ui/button";
import { Info } from "lucide-react";

interface DeviceMetadataDialogProps {
    device: Device;
}

/**
 * Safely parses device metadata which may arrive as a parsed object or a raw JSON string.
 * Returns a Record for key-value display, or null if it cannot be parsed into one.
 */
function parseMetadata(raw: unknown): Record<string, unknown> | null {
    if (raw === null || raw === undefined) return null;

    let parsed = raw;

    // If it's a string, attempt JSON.parse
    if (typeof parsed === "string") {
        try {
            parsed = JSON.parse(parsed);
        } catch {
            return null;
        }
    }

    // Must be a plain object (not an array) to display as key-value pairs
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        const obj = parsed as Record<string, unknown>;
        return Object.keys(obj).length > 0 ? obj : null;
    }

    return null;
}

function formatMetadataValue(value: unknown): string {
    if (value === null || value === undefined) return "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

export function DeviceMetadataDialog({ device }: DeviceMetadataDialogProps) {
    const metadata = parseMetadata(device.metadata);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                    title="View Metadata"
                >
                    <Info className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Device Metadata</DialogTitle>
                    <DialogDescription>
                        Technical details for {device.device_name || 'Unknown Device'}
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto pr-4">
                    {metadata ? (
                        <div className="grid gap-4 py-4">
                            {Object.entries(metadata).map(([key, value]) => (
                                <div key={key} className="grid grid-cols-3 items-center gap-4">
                                    <span className="text-sm font-medium text-muted-foreground capitalize">
                                        {key.replace(/_/g, ' ')}
                                    </span>
                                    <span className="col-span-2 text-sm break-all">
                                        {formatMetadataValue(value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : device.metadata ? (
                        <pre className="whitespace-pre-wrap break-all rounded-md bg-zinc-100 p-4 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            {typeof device.metadata === "string"
                                ? device.metadata
                                : JSON.stringify(device.metadata, null, 2)}
                        </pre>
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">
                            No metadata available for this device.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
