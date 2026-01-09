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
import { DeviceRegistrationCodeDialog } from "@features/devices/components/device-registration-code-dialog";
import { useRevokeDeviceTokens } from "@features/devices/hooks/use-devices";
import { Button } from "@shared/components/ui/button";
import { LogOut } from "lucide-react";

/**
 * Devices page - displays device list using API hook
 */
export default function DevicesPage() {
    const { data, isLoading, isError } = useDevices({ page: 1, per_page: 20 });
    const revokeDeviceTokens = useRevokeDeviceTokens();

    const devices = data?.data ?? [];

    const handleRevoke = async (deviceId: number, deviceName: string) => {
        if (confirm(`Are you sure you want to revoke all tokens for ${deviceName}? The device will need to re-register.`)) {
            revokeDeviceTokens.mutate(deviceId);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Devices</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Manage registered devices and assignments
                    </p>
                </div>
                <DeviceRegistrationCodeDialog />
            </div>

            <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Device Name</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Agent</TableHead>
                            <TableHead>Battery</TableHead>
                            <TableHead>Tracked SIMs</TableHead>
                            <TableHead>Last Sync</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : isError ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center text-red-500">
                                    Failed to load devices
                                </TableCell>
                            </TableRow>
                        ) : devices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">
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
                                    <TableCell>
                                        {device.agent ? (
                                            <span className="text-blue-600 dark:text-blue-400">{device.agent.name}</span>
                                        ) : (
                                            <span className="text-zinc-400">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {device.battery_level !== null && device.battery_level !== undefined ? (
                                            <span className={`font-medium ${device.battery_level > 50 ? 'text-green-600 dark:text-green-400' :
                                                    device.battery_level > 20 ? 'text-yellow-600 dark:text-yellow-400' :
                                                        'text-red-600 dark:text-red-400'
                                                }`}>
                                                {device.battery_level}%
                                            </span>
                                        ) : (
                                            <span className="text-zinc-400">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {device.tracked_sim_slots === null
                                            ? <span className="text-zinc-400">All</span>
                                            : device.tracked_sim_slots.length === 0
                                                ? <span className="text-red-500">None</span>
                                                : device.tracked_sim_slots.join(", ")}
                                    </TableCell>
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
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRevoke(device.id, device.device_name ?? 'Unknown Device')}
                                            disabled={revokeDeviceTokens.isPending}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                                        >
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Revoke
                                        </Button>
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
