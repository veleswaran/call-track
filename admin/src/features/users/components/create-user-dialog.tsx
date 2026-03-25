"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@shared/components/ui/dialog";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@shared/components/ui/form";

import { Input } from "@shared/components/ui/input";
import { Button } from "@shared/components/ui/button";
import { Checkbox } from "@shared/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@shared/components/ui/select";
import { useCreateUser } from "../hooks/use-users";
import { useQuery } from "@tanstack/react-query";
import { teamsApi } from "../../teams/api/teams-api";
import { useAgentStatuses } from "../../agents/hooks/use-agent-statuses";


// ✅ Validation Schema
const formSchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        password_confirmation: z.string(),

        is_agent: z.boolean(),
        is_team: z.boolean(),
        role: z.string().optional(),

        employee_code: z.string().optional(),
        agent_status_id: z.string().optional(),
        team_id: z.string().optional(),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: "Passwords do not match",
        path: ["password_confirmation"],
    })
    .superRefine((data, ctx) => {
        if (data.is_agent) {
            if (!data.employee_code) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Employee code is required",
                    path: ["employee_code"],
                });
            }
            if (!data.agent_status_id) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Status is required",
                    path: ["agent_status_id"],
                });
            }
            if (data.is_team && !data.team_id) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Team is required",
                    path: ["team_id"],
                });
            }
        }
    });

export function CreateUserDialog() {
    const [open, setOpen] = useState(false);
    const { mutate: createUser, isPending } = useCreateUser();
    const [page] = useState(1);
    const { data: teamsData } = useQuery({
        queryKey: ["teams", page],
        queryFn: () => teamsApi.getTeams({ page }),
    });

    const { data: agentStatuses } = useAgentStatuses();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            password_confirmation: "",
            is_agent: false,
            is_team: false,
            employee_code: "",
            agent_status_id: "",
            team_id: "",
            role: "member"
        },
    });

    useEffect(() => {
        if (agentStatuses?.data && agentStatuses.data.length > 0 && !form.getValues("agent_status_id")) {
            const defaultStatus = agentStatuses.data.find(s => s.is_default) || agentStatuses.data[0];
            form.setValue("agent_status_id", defaultStatus.id.toString());
        }
    }, [agentStatuses, form]);
    const isAgent = useWatch({ control: form.control, name: "is_agent" });
    const isTeam = useWatch({ control: form.control, name: "is_team" });

    useEffect(() => {
        if (!isAgent) {
            form.setValue("employee_code", "");
            form.setValue("team_id", "");
            form.setValue("is_team", false);
        }
    }, [isAgent, form]);

    function onSubmit(values: z.infer<typeof formSchema>) {
        const payload = {
            ...values,
            agent_status_id: values.agent_status_id ? parseInt(values.agent_status_id) : undefined,
            team_id: values.team_id ? parseInt(values.team_id) : undefined,
        };

        createUser(payload, {
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Add User</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add User</DialogTitle>
                    <DialogDescription>Create a new system user.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="john@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Password */}
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Confirm Password */}
                        <FormField
                            control={form.control}
                            name="password_confirmation"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Is Agent */}
                        <FormField
                            control={form.control}
                            name="is_agent"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <FormLabel>Is Agent?</FormLabel>
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        {/* 🔥 Agent Fields */}
                        {isAgent && (
                            <>
                                <FormField control={form.control} name="employee_code" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Employee Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="EMP001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="agent_status_id" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {agentStatuses?.data.map((status) => (
                                                    <SelectItem key={status.id} value={status.id.toString()}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                                                            {status.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                {/* Add Team Toggle */}
                                <FormField
                                    control={form.control}
                                    name="is_team"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                            <FormLabel>Add Team</FormLabel>
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {isTeam && (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="team_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Team</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value?.toString() ?? ""}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select Team" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {teamsData?.data.map((team) => (
                                                                <SelectItem key={team.id} value={team.id.toString()}>
                                                                    {team.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="role"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Role</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select Role" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="member">Member</SelectItem>
                                                            <SelectItem value="manager">Manager</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}
                            </>
                        )}

                        <DialogFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Create User
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
