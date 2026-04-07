"use client";

import { useDevices, useRevokeDeviceTokens } from "@features/devices/hooks/use-devices";
import { useSettingsQuery } from "@features/settings/hooks/use-settings";
import { Input } from "@shared/components/ui/input";
import { Button } from "@shared/components/ui/button";
import { DeviceMetadataDialog } from "@features/devices/components/device-metadata-dialog";
import { DevicePushNotificationDialog } from "@features/devices/components/device-push-notification-dialog";

import { useAuth } from "@features/auth/hooks/use-auth";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shared/components/ui/table";
import { DevicePagination } from "@features/devices/components/device-pagination";
import { DeviceHeartbeatBadge } from "@features/devices/components/device-heartbeat-badge";
import { DeviceStatusBadge } from "@features/devices/components/device-status-badge";
import { DeviceEventsDialog } from "@features/devices/components/device-events-dialog";
import { isDeviceStale } from "@features/devices/utils/device-utils";
import { DeviceRegistrationCodeDialog } from "@features/devices/components/device-registration-code-dialog";
import { Smartphone, LogOut, Search, X } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@shared/components/ui/select";

/**
 * Devices page - displays device list using API hook
 */
export default function DevicesPage() {
    const { user } = useAuth();
    const { data: settings } = useSettingsQuery();
    const statuses = [
        { id: 'active', name: 'Active' },
        { id: 'inactive', name: 'Inactive' },
    ];
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<string>("all");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [pagination, setPagination] = useState({ page: 1, per_page: 20 });
    
    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const [prevStatus, setPrevStatus] = useState(status);

    // Reset page on status change
    if (status !== prevStatus) {
        setPrevStatus(status);
        setPagination(prev => ({ ...prev, page: 1 }));
    }
    const { data, isLoading, isError } = useDevices({ 
        ...pagination, 
        search: debouncedSearch,
        status: status === "all" ? undefined : status
    });
    const revokeDeviceTokens = useRevokeDeviceTokens();

    const devices = data?.data ?? [];
    const meta = data?.meta;

    const canManageDevices = user?.permissions?.includes("manage devices") || user?.roles?.includes("super-admin");
    const canGenerateCodes = user?.permissions?.includes("generate registration codes") || user?.roles?.includes("super-admin");

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
                {canGenerateCodes && <DeviceRegistrationCodeDialog />}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search devices by name, model, identifier or agent..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {settings?.enable_device_status_filter && (
                    <div className="w-full sm:w-[180px]">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {statuses?.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            <div className="space-y-4 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Device Name</TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead>Agent</TableHead>
                                <TableHead>Battery</TableHead>
                                <TableHead>App Version</TableHead>
                                <TableHead>Tracked SIMs</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Sync</TableHead>
                                <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-24 text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : isError ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-24 text-center text-red-500">
                                        Failed to load devices
                                    </TableCell>
                                </TableRow>
                            ) : devices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-24 text-center">
                                        No devices found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                devices.map((device) => {
                                    const stale = isDeviceStale(device.last_sync_at);
                                    return (
                                        <TableRow
                                            key={device.id}
                                            className={stale ? "bg-red-50 dark:bg-red-900/10" : ""}
                                        >
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
                                                {device.app_version ? (
                                                    <span className="font-mono text-sm">
                                                        v{device.app_version}
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
                                                <DeviceStatusBadge status={device.status} />
                                            </TableCell>
                                            <TableCell>
                                                <DeviceHeartbeatBadge lastSyncAt={device.last_sync_at} />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <DeviceEventsDialog
                                                        deviceId={device.id}
                                                        deviceName={device.device_name}
                                                    />
                                                    <DeviceMetadataDialog device={device} />
                                                    {canManageDevices && (
                                                        <>
                                                            <DevicePushNotificationDialog device={device} />
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRevoke(device.id, device.device_name ?? 'Unknown Device')}
                                                                disabled={revokeDeviceTokens.isPending}
                                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                                                                title="Revoke Tokens"
                                                            >
                                                                <LogOut className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {meta && (
                    <DevicePagination
                        page={meta.current_page}
                        perPage={meta.per_page}
                        total={meta.total}
                        onChange={(page, per_page) => setPagination({ page, per_page })}
                    />
                )}
            </div>
        </div>
    );
}

