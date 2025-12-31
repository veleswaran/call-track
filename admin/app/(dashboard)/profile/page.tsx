"use client";

import { useAuth } from "@features/auth/hooks/use-auth";
import { TwoFactorSettings } from "@features/auth/components/two-factor-settings";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@shared/components/ui/card";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";

export default function ProfilePage() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="max-w-4xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Profile & Security</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                        Your basic account details.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Name</Label>
                        <Input value={user.name} disabled />
                    </div>
                    <div className="grid gap-2">
                        <Label>Email</Label>
                        <Input value={user.email} disabled />
                    </div>
                </CardContent>
            </Card>

            <TwoFactorSettings />
        </div>
    );
}
