"use client";

import { useState } from "react";
import { Accordion, AccordionItem } from "@shared/components/ui/accordion";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Checkbox } from "@shared/components/ui/checkbox";
import { Trash2, Plus, Star, Loader2 } from "lucide-react";
import { useDeviceStatuses, useCreateDeviceStatus, useUpdateDeviceStatus, useDeleteDeviceStatus, type DeviceStatus } from "@features/devices/hooks/use-device-statuses";
import { cn } from "@shared/utils";

export function DeviceStatusesSettings() {
    const { data: statusesData, isLoading } = useDeviceStatuses();
    const createStatus = useCreateDeviceStatus();
    const updateStatus = useUpdateDeviceStatus();
    const deleteStatus = useDeleteDeviceStatus();
    
    const statuses = statusesData?.data ?? [];

    const [newStatusName, setNewStatusName] = useState("");
    const [newStatusColor, setNewStatusColor] = useState("#6b7280");

    const handleCreate = () => {
        if (!newStatusName.trim()) return;
        createStatus.mutate({
            name: newStatusName,
            color: newStatusColor,
            is_default: statuses.length === 0, // make first one default
            is_active: true,
        }, {
            onSuccess: () => {
                setNewStatusName("");
                setNewStatusColor("#6b7280");
            }
        });
    };

    const handleUpdate = (status: DeviceStatus, updates: Partial<DeviceStatus>) => {
        updateStatus.mutate({
            id: status.id,
            data: {
                name: updates.name ?? status.name,
                color: updates.color ?? status.color,
                is_default: updates.is_default ?? status.is_default,
                is_active: updates.is_active ?? status.is_active,
            }
        });
    };

    const handleDelete = (status: DeviceStatus) => {
        if (confirm(`Are you sure you want to delete the status "${status.name}"?`)) {
            deleteStatus.mutate(status.id);
        }
    };

    return (
        <Accordion className="w-full">
            <AccordionItem title="Device Status Configuration" defaultOpen={false} className="border rounded-xl bg-card text-card-foreground shadow px-6">
                <div className="flex flex-col space-y-1.5 pb-6">
                    <p className="text-sm text-muted-foreground mt-2">
                        Configure the custom status options available for your devices. You can assign colors and select a default status.
                    </p>
                </div>
                {/* Remove Card wrapper, just put content directly */}
                <div className="pb-6 pt-0 space-y-6">
                    {isLoading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                        {statuses.map((status) => (
                            <div key={status.id} className="flex items-center gap-4 p-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                                <Input 
                                    type="color" 
                                    defaultValue={status.color} 
                                    className="w-12 h-10 p-1 cursor-pointer"
                                    onBlur={(e) => {
                                        if (e.target.value !== status.color) {
                                            handleUpdate(status, { color: e.target.value });
                                        }
                                    }}
                                />
                                <Input 
                                    defaultValue={status.name} 
                                    onBlur={(e) => {
                                        if (e.target.value !== status.name) {
                                            handleUpdate(status, { name: e.target.value });
                                        }
                                    }}
                                    className="flex-1"
                                />
                                
                                <div className="flex items-center gap-2 px-2">
                                    <Checkbox
                                        id={`active-${status.id}`}
                                        defaultChecked={status.is_active}
                                        onCheckedChange={(checked: boolean | "indeterminate") => handleUpdate(status, { is_active: checked === true })}
                                    />
                                    <Label htmlFor={`active-${status.id}`} className="text-sm text-zinc-500 whitespace-nowrap">
                                        Active
                                    </Label>
                                </div>

                                <Button 
                                    type="button"
                                    variant={status.is_default ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => !status.is_default && handleUpdate(status, { is_default: true })}
                                    className={cn("gap-1.5", status.is_default ? "pointer-events-none" : "")}
                                    title={status.is_default ? "This is the default status" : "Make Default"}
                                >
                                    <Star className={cn("h-4 w-4", status.is_default ? "fill-current" : "")} />
                                    <span className="sr-only sm:not-sr-only sm:inline-block">Default</span>
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(status)}
                                    disabled={deleteStatus.isPending || status.is_default}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        {/* Add New Status */}
                        <div className="flex items-center gap-4 p-3 rounded-md border border-dashed border-zinc-300 dark:border-zinc-700">
                            <Input 
                                type="color" 
                                value={newStatusColor} 
                                onChange={(e) => setNewStatusColor(e.target.value)}
                                className="w-12 h-10 p-1 cursor-pointer"
                            />
                            <Input 
                                placeholder="New status name..." 
                                value={newStatusName}
                                onChange={(e) => setNewStatusName(e.target.value)}
                                className="flex-1"
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                            />
                            <Button 
                                type="button"
                                onClick={handleCreate} 
                                disabled={!newStatusName.trim() || createStatus.isPending}
                                className="gap-1.5"
                            >
                                {createStatus.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                Add Status
                            </Button>
                        </div>
                    </div>
                )}
                </div>
            </AccordionItem>
        </Accordion>
    );
}
