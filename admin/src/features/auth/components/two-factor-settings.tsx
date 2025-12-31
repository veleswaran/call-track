"use client";

import { useState } from "react";
import { useAuth } from "@features/auth/hooks/use-auth";
import { Button } from "@shared/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@shared/components/ui/card";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { authService } from "@shared/api/auth-service";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export function TwoFactorSettings() {
    const { user, mutate } = useAuth();
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [qrData, setQrData] = useState<{ secret: string; qr_code_url: string } | null>(null);
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

    const handleEnable = async () => {
        setLoading(true);
        try {
            const data = await authService.enableTwoFactor();
            setQrData(data);
            setIsSettingUp(true);
        } catch (_error) {
            toast.error("Failed to start 2FA setup");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!qrData) return;
        setLoading(true);
        try {
            const result = await authService.confirmTwoFactor(qrData.secret, code);
            setRecoveryCodes(result.recovery_codes);
            setIsSettingUp(false);
            setQrData(null);
            mutate(); // Refresh user
            toast.success("Two-factor authentication enabled");
        } catch (_error) {
            toast.error("Invalid code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async () => {
        setLoading(true);
        try {
            await authService.disableTwoFactor(password);
            setPassword("");
            mutate();
            toast.success("Two-factor authentication disabled");
        } catch (_error) {
            toast.error("Incorrect password or failed to disable");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    if (recoveryCodes) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        2FA Enabled Successfully
                    </CardTitle>
                    <CardDescription>
                        Save these recovery codes in a secure place. You won&apos;t see them again.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md bg-zinc-100 p-4 dark:bg-zinc-800">
                        <pre className="font-mono text-sm grid grid-cols-2 gap-2">
                            {recoveryCodes.map((code) => (
                                <span key={code}>{code}</span>
                            ))}
                        </pre>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => setRecoveryCodes(null)}>Done</Button>
                </CardFooter>
            </Card>
        );
    }

    if (isSettingUp && qrData) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Setup Two-Factor Authentication</CardTitle>
                    <CardDescription>
                        Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-center rounded-lg bg-white p-4 w-fit mx-auto border">
                        <QRCodeSVG value={qrData.qr_code_url} size={192} />
                    </div>
                    <div className="space-y-2">
                        <Label>Enter Confirmation Code</Label>
                        <div className="flex gap-2">
                            <Input
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="123456"
                                className="w-40 font-mono text-center tracking-widest"
                                maxLength={6}
                            />
                            <Button onClick={handleConfirm} disabled={loading || code.length !== 6}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="ghost" onClick={() => setIsSettingUp(false)}>Cancel</Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                    Add an extra layer of security to your account.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {user.two_factor_enabled ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">2FA is currently enabled.</span>
                        </div>
                        <div className="space-y-2">
                            <Label>Enter Password to Disable</Label>
                            <div className="flex gap-2 max-w-sm">
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Current Password"
                                />
                                <Button variant="destructive" onClick={handleDisable} disabled={loading || !password}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disable 2FA"}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-5 w-5" />
                            <span>You have not enabled two-factor authentication.</span>
                        </div>
                        <Button onClick={handleEnable} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enable Two-Factor Authentication
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
