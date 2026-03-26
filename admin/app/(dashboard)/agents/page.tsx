"use client";

import { useEffect, useState } from "react";
import { useAgents } from "@features/agents/hooks/use-agents";
import { useAuth } from "@features/auth/hooks/use-auth";
import { useSettingsQuery } from "@features/settings/hooks/use-settings";
import { Input } from "@shared/components/ui/input";
import { AddAgentDialog } from "@features/agents/components/AddAgentDialog";
import { EditAgentDialog } from "@features/agents/components/EditAgentDialog";
import { AssignDeviceDialog } from "@features/agents/components/AssignDeviceDialog";
import { LinkUserDialog } from "@features/agents/components/LinkUserDialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shared/components/ui/table";
import { Button } from "@shared/components/ui/button";
import { User, Pencil, Smartphone, Link as LinkIcon, Search, X } from "lucide-react";
import { CallLogPagination } from "@features/call-logs/components/call-log-pagination";
import type { Agent } from "@shared/types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@shared/components/ui/select";

/**
 * Agents page - displays agent list with CRUD capabilities
 */
export default function AgentsPage() {
    const { user } = useAuth();
    const { data: settings } = useSettingsQuery();
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<string>("all");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const [prevStatus, setPrevStatus] = useState(status);
    
    // Reset page on status change
    if (status !== prevStatus) {
        setPrevStatus(status);
        setPage(1);
    }

    const { data, isLoading, isError } = useAgents({ 
        page, 
        per_page: perPage,
        search: debouncedSearch,
        status: status === "all" ? undefined : status
    });
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [assigningAgent, setAssigningAgent] = useState<Agent | null>(null);
    const [linkingAgent, setLinkingAgent] = useState<Agent | null>(null);

    const availableStatuses = [
        { id: 'active', name: 'Active' },
        { id: 'inactive', name: 'Inactive' }
    ];
    
    const isAdmin = user?.roles.some((role: string) => ['admin', 'super-admin'].includes(role));
    const agents = data?.data ?? [];
    const meta = data?.meta;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Manage sales agents and their device assignments
                    </p>
                </div>
                {isAdmin && <AddAgentDialog />}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search agents by name or code..."
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

                {settings?.enable_agent_status_filter && (
                    <div className="w-full sm:w-[180px]">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {availableStatuses.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Employee Code</TableHead>
                            <TableHead>Devices</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
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
                                    Failed to load agents
                                </TableCell>
                            </TableRow>
                        ) : agents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No agents found. Click &quot;Add Agent&quot; to create one.
                                </TableCell>
                            </TableRow>
                        ) : (
                            agents.map((agent) => (
                                <TableRow key={agent.id}>
                                    <TableCell>
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                                            <User className="h-4 w-4 text-zinc-500" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{agent.name}</TableCell>
                                    <TableCell>
                                        <span className="text-sm text-zinc-500">
                                            {agent.employee_code || "-"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-medium">{agent.devices_count ?? 0}</span>
                                    </TableCell>
                                    <TableCell>
                                        {agent.status ? (
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                                                    agent.status === 'active' 
                                                        ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-400' 
                                                        : 'bg-zinc-500/20 text-zinc-500 border-zinc-500/40 dark:bg-zinc-500/10 dark:text-zinc-400'
                                                }`}
                                            >
                                                {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {isAdmin && !agent.user_id && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setLinkingAgent(agent)}
                                                    title="Link User"
                                                >
                                                    <LinkIcon className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setAssigningAgent(agent)}
                                                title="Manage Devices"
                                            >
                                                <Smartphone className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setEditingAgent(agent)}
                                                title="Edit Agent"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {meta && (
                <div className="py-4 border-t border-zinc-200 dark:border-zinc-800">
                    <CallLogPagination
                        page={page}
                        perPage={perPage}
                        total={meta.total}
                        onChange={(p, pp) => {
                            setPage(p);
                            setPerPage(pp);
                        }}
                    />
                </div>
            )}

            {/* Edit Dialog */}
            {editingAgent && (
                <EditAgentDialog
                    agent={editingAgent}
                    open={!!editingAgent}
                    onOpenChange={(open) => !open && setEditingAgent(null)}
                />
            )}

            {/* Assign Device Dialog */}
            {assigningAgent && (
                <AssignDeviceDialog
                    agent={assigningAgent}
                    open={!!assigningAgent}
                    onOpenChange={(open) => !open && setAssigningAgent(null)}
                />
            )}

            {/* Link User Dialog */}
            {linkingAgent && (
                <LinkUserDialog
                    agent={linkingAgent}
                    open={!!linkingAgent}
                    onOpenChange={(open) => !open && setLinkingAgent(null)}
                />
            )}
        </div>
    );
}
