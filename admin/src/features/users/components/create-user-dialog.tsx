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
import { useCreateUser } from "../hooks/use-users";
import { useQuery } from "@tanstack/react-query";
import { teamsApi } from "../../teams/api/teams-api";


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
        status: z.enum(["active", "inactive"]).optional(),
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
            if (!data.status) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Status is required",
                    path: ["status"],
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
            status: "active",
            team_id: "",
            role: "MEMBER"
        },
    });
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
        console.log(values)
        createUser(values, {
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
                                <FormItem className="flex flex-row items-center justify-between rounded-lg  px-3">
                                    <FormLabel>Is Agent?</FormLabel>
                                    <FormControl>
                                        <input
                                            type="checkbox"
                                            checked={field.value}
                                            onChange={(e) => field.onChange(e.target.checked)}
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
                                <FormField control={form.control} name="status" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <FormControl>
                                            <select className="w-full border rounded px-3 py-2" value={field.value} onChange={field.onChange} >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                {/* Add Team Toggle */}
                                <FormField
                                    control={form.control}
                                    name="is_team"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg px-3">
                                            <FormLabel>Add Team</FormLabel>
                                            <FormControl>
                                                <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
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
                                                    <FormControl>
                                                        <select className="w-full border rounded px-3 py-2" value={field.value} onChange={field.onChange} >
                                                            <option value="">Select Team</option>
                                                            {teamsData?.data.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                                                        </select>
                                                    </FormControl>
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
                                                    <FormControl>
                                                        <select className="w-full border rounded px-3 py-2" value={field.value} onChange={field.onChange} >
                                                            <option value="MEMBER">Member</option>
                                                            <option value="MANAGER">Manager</option>
                                                        </select>
                                                    </FormControl>
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
