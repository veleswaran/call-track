"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { History } from "lucide-react";
import { useDeviceEvents } from "../hooks/use-device-events";
import { DeviceEventsTimeline } from "./device-events-timeline";

interface DeviceEventsDialogProps {
    deviceId: number;
    deviceName: string | null;
}

export function DeviceEventsDialog({
    deviceId,
    deviceName,
}: DeviceEventsDialogProps) {
    const [open, setOpen] = useState(false);
    const { data, isLoading } = useDeviceEvents(
        deviceId,
        { per_page: 50 },
        { enabled: open }
    );

    const events = data?.data ?? [];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" title="View Events">
                    <History className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        Device Events
                        {deviceName && (
                            <span className="ml-2 text-sm font-normal text-zinc-500">
                                ({deviceName})
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>
                <DeviceEventsTimeline events={events} isLoading={isLoading} />
            </DialogContent>
        </Dialog>
    );
}
