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

export function DeviceMetadataDialog({ device }: DeviceMetadataDialogProps) {
    const metadata = device.metadata || {};
    const hasMetadata = Object.keys(metadata).length > 0;

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
                    {hasMetadata ? (
                        <div className="grid gap-4 py-4">
                            {Object.entries(metadata).map(([key, value]) => (
                                <div key={key} className="grid grid-cols-3 items-center gap-4">
                                    <span className="text-sm font-medium text-muted-foreground capitalize">
                                        {key.replace(/_/g, ' ')}
                                    </span>
                                    <span className="col-span-2 text-sm break-all">
                                        {String(value)}
                                    </span>
                                </div>
                            ))}
                        </div>
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
