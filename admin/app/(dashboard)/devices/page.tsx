"use client";

import { useDevices } from "@features/devices/hooks/use-devices";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shared/components/ui/table";
import { Smartphone } from "lucide-react";
import { format } from "date-fns";

/**
 * Devices page - displays device list using API hook
 */
export default function DevicesPage() {
    const { data, isLoading, isError } = useDevices({ page: 1, per_page: 20 });

    const devices = data?.data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Devices</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Manage registered devices and assignments
                    </p>
                </div>
            </div>

            <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Device Name</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>OS Version</TableHead>
                            <TableHead>Last Sync</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : isError ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-red-500">
                                    Failed to load devices
                                </TableCell>
                            </TableRow>
                        ) : devices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No devices found
                                </TableCell>
                            </TableRow>
                        ) : (
                            devices.map((device) => (
                                <TableRow key={device.id}>
                                    <TableCell>
                                        <Smartphone className="h-5 w-5 text-zinc-400" />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {device.device_name}
                                    </TableCell>
                                    <TableCell>{device.device_model}</TableCell>
                                    <TableCell>{device.os_version}</TableCell>
                                    <TableCell>
                                        {device.last_sync_at
                                            ? format(new Date(device.last_sync_at), "MMM d, h:mm a")
                                            : "Never"}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${device.status === 'active'
                                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                                                }`}
                                        >
                                            {device.status === 'active' ? "Active" : "Suspended"}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
