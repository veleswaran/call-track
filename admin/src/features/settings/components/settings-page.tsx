"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@shared/components/ui/form";
import { Input } from "@shared/components/ui/input";
import { Textarea } from "@shared/components/ui/textarea";
import { Button } from "@shared/components/ui/button";
import { useSettingsQuery, useUpdateSettingsMutation } from "../hooks/use-settings";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@shared/components/ui/checkbox";
import { Accordion, AccordionItem } from "@shared/components/ui/accordion";
import { FilterVisibilityMatrix } from "./FilterVisibilityMatrix";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shared/components/ui/table";

const formSchema = z.object({
    app_sitename: z.string().min(1, "Site name is required").max(50, "Site name is too long"),
    heartbeat_threshold_minutes: z.number().min(5, "Minimum threshold is 5 minutes").max(10080, "Maximum is 1 week"),
    device_archive_days: z.number().min(1, "Minimum threshold is 1 day").max(365, "Maximum is 365 days"),
    fcm_stale_title: z.string().min(1, "Title is required").max(100, "Title is too long"),
    fcm_stale_body: z.string().min(1, "Message body is required").max(500, "Message body is too long"),
    escalation_sla_hours: z.number().min(1, "Minimum is 1 hour").max(168, "Maximum is 1 week (168 hours)"),
    enable_call_log_sim_filter: z.boolean(),
    enable_agent_status_filter: z.boolean(),
    enable_device_status_filter: z.boolean(),
    enable_call_log_internal_filter: z.boolean(),
    enable_report_internal_filter: z.boolean(),
    enable_missed_call_internal_filter: z.boolean(),
    enable_call_log_agent_filter: z.boolean(),
    enable_missed_call_agent_filter: z.boolean(),
    enable_report_agent_filter: z.boolean(),
    enable_call_log_team_filter: z.boolean(),
    enable_missed_call_team_filter: z.boolean(),
    enable_report_team_filter: z.boolean(),
    enable_call_log_class_filter: z.boolean(),
    enable_missed_call_class_filter: z.boolean(),
    enable_report_class_filter: z.boolean(),
    enable_call_log_outcome_filter: z.boolean(),
    enable_report_outcome_filter: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function SettingsPage() {
    const { data: settings, isLoading } = useSettingsQuery();
    const updateSettings = useUpdateSettingsMutation();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            app_sitename: "CallTrack AI",
            heartbeat_threshold_minutes: 60,
            device_archive_days: 15,
            fcm_stale_title: "",
            fcm_stale_body: "",
            escalation_sla_hours: 2,
            enable_call_log_sim_filter: true,
            enable_agent_status_filter: true,
            enable_device_status_filter: true,
            enable_call_log_internal_filter: true,
            enable_report_internal_filter: true,
            enable_missed_call_internal_filter: true,
            enable_call_log_agent_filter: true,
            enable_missed_call_agent_filter: true,
            enable_report_agent_filter: true,
            enable_call_log_team_filter: true,
            enable_missed_call_team_filter: true,
            enable_report_team_filter: true,
            enable_call_log_class_filter: true,
            enable_missed_call_class_filter: true,
            enable_report_class_filter: true,
            enable_call_log_outcome_filter: true,
            enable_report_outcome_filter: true,
        },
    });

    useEffect(() => {
        if (settings && !form.formState.isDirty) {
            form.reset({
                app_sitename: settings.app_sitename || "CallTrack AI",
                heartbeat_threshold_minutes: Number(settings.heartbeat_threshold_minutes),
                device_archive_days: Number(settings.device_archive_days ?? 15),
                fcm_stale_title: settings.fcm_stale_title,
                fcm_stale_body: settings.fcm_stale_body,
                escalation_sla_hours: Number(settings.escalation_sla_hours ?? 2),
                enable_call_log_sim_filter: !!settings.enable_call_log_sim_filter,
                enable_agent_status_filter: !!settings.enable_agent_status_filter,
                enable_device_status_filter: !!settings.enable_device_status_filter,
                enable_call_log_internal_filter: !!settings.enable_call_log_internal_filter,
                enable_report_internal_filter: !!settings.enable_report_internal_filter,
                enable_missed_call_internal_filter: !!settings.enable_missed_call_internal_filter,
                enable_call_log_agent_filter: !!settings.enable_call_log_agent_filter,
                enable_missed_call_agent_filter: !!settings.enable_missed_call_agent_filter,
                enable_report_agent_filter: !!settings.enable_report_agent_filter,
                enable_call_log_team_filter: !!settings.enable_call_log_team_filter,
                enable_missed_call_team_filter: !!settings.enable_missed_call_team_filter,
                enable_report_team_filter: !!settings.enable_report_team_filter,
                enable_call_log_class_filter: !!settings.enable_call_log_class_filter,
                enable_missed_call_class_filter: !!settings.enable_missed_call_class_filter,
                enable_report_class_filter: !!settings.enable_report_class_filter,
                enable_call_log_outcome_filter: !!settings.enable_call_log_outcome_filter,
                enable_report_outcome_filter: !!settings.enable_report_outcome_filter,
            });
        }
    }, [settings, form]);

    function onSubmit(values: FormValues) {
        updateSettings.mutate({
            settings: {
                app_sitename: values.app_sitename,
                heartbeat_threshold_minutes: Number(values.heartbeat_threshold_minutes),
                device_archive_days: Number(values.device_archive_days),
                fcm_stale_title: values.fcm_stale_title,
                fcm_stale_body: values.fcm_stale_body,
                escalation_sla_hours: Number(values.escalation_sla_hours),
                enable_call_log_sim_filter: values.enable_call_log_sim_filter,
                enable_agent_status_filter: values.enable_agent_status_filter,
                enable_device_status_filter: values.enable_device_status_filter,
                enable_call_log_internal_filter: values.enable_call_log_internal_filter,
                enable_report_internal_filter: values.enable_report_internal_filter,
                enable_missed_call_internal_filter: values.enable_missed_call_internal_filter,
                enable_call_log_agent_filter: values.enable_call_log_agent_filter,
                enable_missed_call_agent_filter: values.enable_missed_call_agent_filter,
                enable_report_agent_filter: values.enable_report_agent_filter,
                enable_call_log_team_filter: values.enable_call_log_team_filter,
                enable_missed_call_team_filter: values.enable_missed_call_team_filter,
                enable_report_team_filter: values.enable_report_team_filter,
                enable_call_log_class_filter: values.enable_call_log_class_filter,
                enable_missed_call_class_filter: values.enable_missed_call_class_filter,
                enable_report_class_filter: values.enable_report_class_filter,
                enable_call_log_outcome_filter: values.enable_call_log_outcome_filter,
                enable_report_outcome_filter: values.enable_report_outcome_filter,
            }
        });
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle>Application Branding</CardTitle>
                            <CardDescription>
                                Customize the platform name and logo.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="app_sitename"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Site Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. CallTrack AI" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            This name will appear in the sidebar and browser title.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle>Device Monitoring</CardTitle>
                            <CardDescription>
                                Configure background sync checking and push notification messages.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="heartbeat_threshold_minutes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stale Heartbeat Threshold (minutes)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Devices without a heartbeat for this long will receive a &quot;wake up&quot; push notification.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="device_archive_days"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Device Inactivity Archive Threshold (days)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Inactive devices will be archived automatically after this many days.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="fcm_stale_title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Push Notification Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. CallTrack needs your attention" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="fcm_stale_body"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Push Notification Message</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="e.g. Your device is going into sleep mode..."
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle>Missed Call Rules</CardTitle>
                            <CardDescription>
                                Configure how quickly missed calls are marked as unattended.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="escalation_sla_hours"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Escalation SLA Deadline (hours)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Missed calls without a follow-up within this many hours will be flagged as unattended.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <Accordion>
                            <AccordionItem title="Filter Configuration" defaultOpen={true} className="px-6">
                                <div className="space-y-6 pb-6 pt-2">
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        Configure which filters are visible on each dashboard page.
                                    </p>
                                    
                                    <FilterVisibilityMatrix />

                                    <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Management Filters</h3>
                                        </div>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                                            Enable or disable status filtering on management pages (Agents, Devices).
                                        </p>

                                        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden max-w-2xl">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50">
                                                        <TableHead className="w-[120px] font-bold">Filter</TableHead>
                                                        <TableHead className="text-center font-bold">Agents</TableHead>
                                                        <TableHead className="text-center font-bold">Device</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell className="font-medium">Status</TableCell>
                                                        <TableCell className="text-center">
                                                            <FormField
                                                                control={form.control}
                                                                name="enable_agent_status_filter"
                                                                render={({ field }) => (
                                                                    <FormItem className="flex justify-center">
                                                                        <FormControl>
                                                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                                        </FormControl>
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <FormField
                                                                control={form.control}
                                                                name="enable_device_status_filter"
                                                                render={({ field }) => (
                                                                    <FormItem className="flex justify-center">
                                                                        <FormControl>
                                                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                                        </FormControl>
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                            </AccordionItem>
                        </Accordion>
                    </Card>
                    <Button type="submit" disabled={updateSettings.isPending}>
                        {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Settings
                    </Button>
                </form>
            </Form>
        </div>
    );
}
