"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@shared/components/ui/card";
import { authService } from "@shared/api/auth-service";

/**
 * Login page for admin authentication
 * Uses Laravel Sanctum cookie-based auth
 */
export default function LoginPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [twoFactorCode, setTwoFactorCode] = React.useState("");
    const [requiresTwoFactor, setRequiresTwoFactor] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (requiresTwoFactor) {
                await authService.twoFactorChallenge(twoFactorCode);
                await queryClient.invalidateQueries({ queryKey: ["user"] });
                setLoading(false);
                router.push("/");
            } else {
                const response = await authService.login({ email, password });
                if (response.requires_two_factor) {
                    setRequiresTwoFactor(true);
                    setLoading(false);
                    return;
                }
                await queryClient.invalidateQueries({ queryKey: ["user"] });
                setLoading(false);
                router.push("/");
            }
        } catch (error: unknown) {
            // Check for specific validation errors/messages
            let errorMessage = "Authentication failed";

            if (typeof error === "object" && error !== null) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const err = error as any;
                errorMessage = err.data?.message || err.message || errorMessage;
            }

            setError(errorMessage);
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">CallTrack AI</CardTitle>
                    <CardDescription>Admin Console</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div
                                className="rounded-lg bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/20"
                                role="alert"
                                data-testid="login-error"
                            >
                                {error}
                            </div>
                        )}
                        {!requiresTwoFactor ? (
                            <>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium">
                                        Email
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@example.com"
                                        required
                                        autoComplete="email"
                                        data-testid="email-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-sm font-medium">
                                        Password
                                    </label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        autoComplete="current-password"
                                        data-testid="password-input"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <label htmlFor="code" className="text-sm font-medium">
                                    Two-Factor Code
                                </label>
                                <Input
                                    id="code"
                                    type="text"
                                    value={twoFactorCode}
                                    onChange={(e) => setTwoFactorCode(e.target.value)}
                                    placeholder="123456"
                                    required
                                    autoComplete="one-time-code"
                                    data-testid="2fa-input"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Enter the code from your authenticator app.
                                </p>
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                            data-testid="login-submit"
                        >
                            {loading ? "Verifying..." : (requiresTwoFactor ? "Verify Code" : "Sign In")}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
