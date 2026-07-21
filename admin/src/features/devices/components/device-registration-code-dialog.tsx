"use client";

import { useState } from "react";
import { useAgents } from "@features/agents/hooks/use-agents";
import { AsyncSelect } from "@shared/components/async-select";
import { useGenerateDeviceCode, GeneratedCode } from "@features/devices/hooks/use-devices";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { Loader2, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ApiError } from "@shared/api/api";

export function DeviceRegistrationCodeDialog() {
    const [open, setOpen] = useState(false);
    const [selectedAgentId, setSelectedAgentId] = useState<string>("");
    const [expiresIn, setExpiresIn] = useState("");
    const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
    const [copied, setCopied] = useState(false);

    // Fetch agents for dropdown (without limit)
    const { data: agentsData } = useAgents({ page: 1, per_page: 10000 });
    const agents = agentsData?.data ?? [];

    const { mutate: generateCode, isPending: isGenerating } = useGenerateDeviceCode();

    const handleGenerate = () => {
        if (!selectedAgentId) return;

        generateCode(
            {
                agent_id: parseInt(selectedAgentId),
                expires_in_hours: expiresIn ? parseInt(expiresIn) : null,
            },
            {
                onSuccess: (response) => {
                    setGeneratedCode(response.data);
                    setCopied(false);
                    toast.success("Code generated successfully");
                },
                onError: (error: ApiError) => {
                    toast.error(error.message || "Failed to generate code");
                },
            }
        );
    };

    const copyToClipboard = () => {
        if (generatedCode) {
            navigator.clipboard.writeText(generatedCode.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const reset = () => {
        setGeneratedCode(null);
        setSelectedAgentId("");
        setExpiresIn("");
        setCopied(false);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) reset();
        }}>
            <DialogTrigger asChild>
                <Button>Generate Registration Code</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate Device Registration Code</DialogTitle>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        Create a one-time code for agent device registration.
                    </div>
                </DialogHeader>

                {!generatedCode ? (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Agent</label>
                            <AsyncSelect
                                value={selectedAgentId}
                                onChange={setSelectedAgentId}
                                loadOptions={async (search) => {
                                    const lowerSearch = search.toLowerCase();
                                    return agents
                                        .filter(agent => 
                                            agent.name.toLowerCase().includes(lowerSearch) || 
                                            (agent.employee_code && agent.employee_code.toLowerCase().includes(lowerSearch))
                                        )
                                        .map((agent) => ({
                                            label: `${agent.name} (${agent.employee_code ?? "No code"})`,
                                            value: agent.id.toString(),
                                        }));
                                }}
                                placeholder="Search agent..."
                                label="Agent"
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Expires In</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950"
                                value={expiresIn}
                                onChange={(e) => setExpiresIn(e.target.value)}
                            >
                                <option value="">No Expiration</option>
                                <option value="168">1 Week</option>
                                <option value="720">1 Month</option>
                                <option value="2160">3 Months</option>
                            </select>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 py-6 text-center">
                        <div className="text-sm text-zinc-500">Provide this code to the agent</div>
                        <div className="flex items-center justify-center space-x-2">
                            <code className="rounded bg-zinc-100 px-4 py-2 text-3xl font-bold tracking-widest dark:bg-zinc-800">
                                {generatedCode.code}
                            </code>
                            <Button variant="outline" size="icon" onClick={copyToClipboard}>
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                        <div className="text-xs text-zinc-500">
                            {generatedCode.expires_at
                                ? `Expires on ${format(new Date(generatedCode.expires_at), "PPP p")}`
                                : "Never expires"}
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {!generatedCode ? (
                        <Button onClick={handleGenerate} disabled={!selectedAgentId || isGenerating}>
                            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate Code
                        </Button>
                    ) : (
                        <Button onClick={() => setOpen(false)}>Done</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
