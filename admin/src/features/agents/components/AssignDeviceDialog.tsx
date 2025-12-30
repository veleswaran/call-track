"use client";

import { Button } from "@shared/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@shared/components/ui/dialog";
import { Smartphone, Check, X } from "lucide-react";
import { useDevices, useAssignDevice, useUnassignDevice } from "../hooks/use-agents";
import type { Agent } from "@shared/types";

interface AssignDeviceDialogProps {
    agent: Agent;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Dialog for assigning/unassigning devices to an agent
 */
export function AssignDeviceDialog({ agent, open, onOpenChange }: AssignDeviceDialogProps) {
    const { data: devicesData, isLoading } = useDevices();
    const assignDevice = useAssignDevice();
    const unassignDevice = useUnassignDevice();

    const devices = devicesData?.data ?? [];

    // Filter devices: show all devices with option to assign/unassign
    const assignedDevices = devices.filter((d) => d.agent_id === agent.id);
    const availableDevices = devices.filter((d) => d.agent_id === null);

    const handleAssign = async (deviceId: number) => {
        try {
            await assignDevice.mutateAsync({ deviceId, agentId: agent.id });
        } catch {
            // Error handled by mutation
        }
    };

    const handleUnassign = async (deviceId: number) => {
        try {
            await unassignDevice.mutateAsync(deviceId);
        } catch {
            // Error handled by mutation
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Manage Devices for {agent.name}</DialogTitle>
                    <DialogDescription>
                        Assign or unassign devices to track this agent&apos;s performance.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    {/* Assigned Devices */}
                    {assignedDevices.length > 0 && (
                        <div>
                            <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Assigned Devices
                            </h4>
                            <div className="space-y-2">
                                {assignedDevices.map((device) => (
                                    <div
                                        key={device.id}
                                        className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Smartphone className="h-4 w-4 text-green-600" />
                                            <span className="text-sm font-medium">
                                                {device.device_name || device.device_identifier}
                                            </span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleUnassign(device.id)}
                                            disabled={unassignDevice.isPending}
                                        >
                                            <X className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Available Devices */}
                    {availableDevices.length > 0 && (
                        <div>
                            <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Available Devices
                            </h4>
                            <div className="space-y-2">
                                {availableDevices.map((device) => (
                                    <div
                                        key={device.id}
                                        className="flex items-center justify-between rounded-lg border p-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Smartphone className="h-4 w-4 text-zinc-400" />
                                            <span className="text-sm">
                                                {device.device_name || device.device_identifier}
                                            </span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleAssign(device.id)}
                                            disabled={assignDevice.isPending}
                                        >
                                            <Check className="mr-1 h-4 w-4" />
                                            Assign
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isLoading && (
                        <div className="py-8 text-center text-zinc-500">Loading devices...</div>
                    )}

                    {!isLoading && devices.length === 0 && (
                        <div className="py-8 text-center text-zinc-500">
                            No devices registered yet.
                        </div>
                    )}

                    {!isLoading && assignedDevices.length === 0 && availableDevices.length === 0 && devices.length > 0 && (
                        <div className="py-8 text-center text-zinc-500">
                            All devices are assigned to other agents.
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
