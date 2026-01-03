"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@shared/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@shared/components/ui/form";
import { Input } from "@shared/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@shared/components/ui/card";
import { useChangePassword } from "../hooks/use-change-password";
import { ApiError } from "@shared/api/api";

const formSchema = z
    .object({
        current_password: z.string().min(1, "Current password is required"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        password_confirmation: z.string().min(1, "Password confirmation is required"),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: "Passwords do not match",
        path: ["password_confirmation"],
    });

export function ChangePasswordForm() {
    const { mutate: changePassword, isPending } = useChangePassword();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            current_password: "",
            password: "",
            password_confirmation: "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        changePassword(values, {
            onSuccess: () => {
                form.reset();
            },
            onError: (error: ApiError) => {
                if (error.status === 422 && error.data && typeof error.data === 'object') {
                    const validationError = error.data as { errors?: Record<string, string[]> };
                    const errors = validationError.errors;
                    if (errors) {
                        const formFields = ['current_password', 'password', 'password_confirmation'] as const;
                        type FormField = typeof formFields[number];

                        Object.keys(errors).forEach((key) => {
                            if (formFields.includes(key as FormField)) {
                                form.setError(key as FormField, {
                                    message: errors[key][0],
                                });
                            }
                        });
                    }
                }
            }
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                    Update your password to keep your account secure.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="current_password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Updating..." : "Update Password"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
