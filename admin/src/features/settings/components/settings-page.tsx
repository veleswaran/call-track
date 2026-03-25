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
import { DeviceStatusesSettings } from "./device-statuses-settings";
import { AgentStatusesSettings } from "./agent-statuses-settings";

const formSchema = z.object({
    heartbeat_threshold_minutes: z.number().min(5, "Minimum threshold is 5 minutes").max(10080, "Maximum is 1 week"),
    fcm_stale_title: z.string().min(1, "Title is required").max(100, "Title is too long"),
    fcm_stale_body: z.string().min(1, "Message body is required").max(500, "Message body is too long"),
    escalation_sla_hours: z.number().min(1, "Minimum is 1 hour").max(168, "Maximum is 1 week (168 hours)"),
    enable_call_log_sim_filter: z.boolean(),
    enable_agent_status_filter: z.boolean(),
    enable_device_status_filter: z.boolean(),
    enable_call_log_internal_filter: z.boolean(),
    enable_report_internal_filter: z.boolean(),
    enable_missed_call_internal_filter: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function SettingsPage() {
    const { data: settings, isLoading } = useSettingsQuery();
    const updateSettings = useUpdateSettingsMutation();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            heartbeat_threshold_minutes: 60,
            fcm_stale_title: "",
            fcm_stale_body: "",
            escalation_sla_hours: 2,
            enable_call_log_sim_filter: false,
            enable_agent_status_filter: false,
            enable_device_status_filter: false,
            enable_call_log_internal_filter: false,
            enable_report_internal_filter: false,
            enable_missed_call_internal_filter: false,
        },
    });

    useEffect(() => {
        if (settings) {
            form.reset({
                heartbeat_threshold_minutes: Number(settings.heartbeat_threshold_minutes),
                fcm_stale_title: settings.fcm_stale_title,
                fcm_stale_body: settings.fcm_stale_body,
                escalation_sla_hours: Number(settings.escalation_sla_hours ?? 2),
                enable_call_log_sim_filter: !!settings.enable_call_log_sim_filter,
                enable_agent_status_filter: !!settings.enable_agent_status_filter,
                enable_device_status_filter: !!settings.enable_device_status_filter,
                enable_call_log_internal_filter: !!settings.enable_call_log_internal_filter,
                enable_report_internal_filter: !!settings.enable_report_internal_filter,
                enable_missed_call_internal_filter: !!settings.enable_missed_call_internal_filter,
            });
        }
    }, [settings, form]);

    function onSubmit(values: FormValues) {
        updateSettings.mutate({
            settings: {
                heartbeat_threshold_minutes: Number(values.heartbeat_threshold_minutes),
                fcm_stale_title: values.fcm_stale_title,
                fcm_stale_body: values.fcm_stale_body,
                escalation_sla_hours: Number(values.escalation_sla_hours),
                enable_call_log_sim_filter: values.enable_call_log_sim_filter,
                enable_agent_status_filter: values.enable_agent_status_filter,
                enable_device_status_filter: values.enable_device_status_filter,
                enable_call_log_internal_filter: values.enable_call_log_internal_filter,
                enable_report_internal_filter: values.enable_report_internal_filter,
                enable_missed_call_internal_filter: values.enable_missed_call_internal_filter,
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
                            <AccordionItem title="Filter Configuration" defaultOpen={false} className="px-6">
                                <div className="space-y-2">
                                    <Accordion className="border-none divide-y-0">
                                         <AccordionItem title="SIM Slot Configuration" defaultOpen={false} className="px-0">
                                             <div className="space-y-6 pt-2 pb-4">
                                                 <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                                     Enable or disable SIM slot filtering on specific pages.
                                                 </p>
  
                                                 <div className="space-y-4">
                                                     <FormField
                                                         control={form.control}
                                                         name="enable_call_log_sim_filter"
                                                         render={({ field }) => (
                                                             <FormItem className="flex flex-row items-center space-x-3 space-y-0 text-zinc-900 dark:text-zinc-100">
                                                                 <FormControl>
                                                                     <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                                 </FormControl>
                                                                 <FormLabel className="text-base font-normal cursor-pointer">Call Logs</FormLabel>
                                                             </FormItem>
                                                         )}
                                                     />
                                                 </div>
                                             </div>
                                         </AccordionItem>
  
                                         <AccordionItem title="Status Filter Configuration" defaultOpen={false} className="px-0">
                                             <div className="space-y-6 pt-2 pb-4">
                                                 <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                                     Enable or disable status filtering for agents and devices.
                                                 </p>
  
                                                 <div className="space-y-4">
                                                     <FormField
                                                         control={form.control}
                                                         name="enable_agent_status_filter"
                                                         render={({ field }) => (
                                                             <FormItem className="flex flex-row items-center space-x-3 space-y-0 text-zinc-900 dark:text-zinc-100">
                                                                 <FormControl>
                                                                     <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                                 </FormControl>
                                                                 <FormLabel className="text-base font-normal cursor-pointer">Agents</FormLabel>
                                                             </FormItem>
                                                         )}
                                                     />
                                                     <FormField
                                                         control={form.control}
                                                         name="enable_device_status_filter"
                                                         render={({ field }) => (
                                                             <FormItem className="flex flex-row items-center space-x-3 space-y-0 text-zinc-900 dark:text-zinc-100">
                                                                 <FormControl>
                                                                     <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                                 </FormControl>
                                                                 <FormLabel className="text-base font-normal cursor-pointer">Devices</FormLabel>
                                                             </FormItem>
                                                         )}
                                                     />
                                                 </div>
                                             </div>
                                         </AccordionItem>
 
                                         <AccordionItem title="Contact Filter Configuration" defaultOpen={false} className="px-0">
                                             <div className="space-y-6 pt-2 pb-4">
                                                 <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                                     Enable or disable internal and external call filtering.
                                                 </p>
  
                                                 <div className="space-y-4">
                                                     <FormField
                                                         control={form.control}
                                                         name="enable_call_log_internal_filter"
                                                         render={({ field }) => (
                                                             <FormItem className="flex flex-row items-center space-x-3 space-y-0 text-zinc-900 dark:text-zinc-100">
                                                                 <FormControl>
                                                                     <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                                 </FormControl>
                                                                 <FormLabel className="text-base font-normal cursor-pointer">Call Logs</FormLabel>
                                                             </FormItem>
                                                         )}
                                                     />
                                                     <FormField
                                                         control={form.control}
                                                         name="enable_report_internal_filter"
                                                         render={({ field }) => (
                                                             <FormItem className="flex flex-row items-center space-x-3 space-y-0 text-zinc-900 dark:text-zinc-100">
                                                                 <FormControl>
                                                                     <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                                 </FormControl>
                                                                 <FormLabel className="text-base font-normal cursor-pointer">Reports</FormLabel>
                                                             </FormItem>
                                                         )}
                                                     />
                                                     <FormField
                                                         control={form.control}
                                                         name="enable_missed_call_internal_filter"
                                                         render={({ field }) => (
                                                             <FormItem className="flex flex-row items-center space-x-3 space-y-0 text-zinc-900 dark:text-zinc-100">
                                                                 <FormControl>
                                                                     <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                                 </FormControl>
                                                                 <FormLabel className="text-base font-normal cursor-pointer">Missed Calls</FormLabel>
                                                             </FormItem>
                                                         )}
                                                     />
                                                 </div>
                                             </div>
                                         </AccordionItem>
                                    </Accordion>
                                </div>
                            </AccordionItem>
                        </Accordion>
                    </Card>

                    <DeviceStatusesSettings />
                    <AgentStatusesSettings />

                    <Button type="submit" disabled={updateSettings.isPending}>
                        {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Settings
                    </Button>
                </form>
            </Form>
        </div>
    );
}
