import { useState } from "react";
import { Device } from "@shared/types";
import { useSendPushNotification } from "../hooks/use-devices";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Textarea } from "@shared/components/ui/textarea";
import { Label } from "@shared/components/ui/label";
import { toast } from "sonner";
import { Bell, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@shared/components/ui/dialog";

interface DevicePushNotificationDialogProps {
    device: Device;
}

export function DevicePushNotificationDialog({ device }: DevicePushNotificationDialogProps) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");

    const sendPush = useSendPushNotification(device.id);

    const handleSend = () => {
        sendPush.mutate(
            { title: title.trim(), body: body.trim() },
            {
                onSuccess: () => {
                    toast.success("Push Notification Sent", {
                        description: `Successfully sent message to ${device.device_name}`,
                    });
                    setOpen(false);
                    setTitle("");
                    setBody("");
                },
                onError: (error: any) => {
                    toast.error("Failed to send", {
                        description: error?.response?.data?.message || "An error occurred",
                    });
                }
            }
        );
    };

    const hasFcmToken = !!device.has_fcm_token;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10"
                    title="Send Push Notification"
                    disabled={!hasFcmToken}
                >
                    <Bell className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Send Push Notification</DialogTitle>
                    <DialogDescription>
                        Send a manual push notification to <strong className="font-semibold">{device.device_name}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title (Optional)</Label>
                        <Input
                            id="title"
                            placeholder="e.g. CallTrack needs your attention"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Defaults to the system setting if left blank.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="body">Message Body (Optional)</Label>
                        <Textarea
                            id="body"
                            placeholder="e.g. Your device is going into sleep mode..."
                            className="resize-none"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Defaults to the system setting if left blank.</p>
                    </div>
                </div>
                <DialogFooter className="sm:justify-end">
                    <Button variant="secondary" onClick={() => setOpen(false)} disabled={sendPush.isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleSend} disabled={sendPush.isPending}>
                        {sendPush.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Push
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
