import { SettingsPage } from "@features/settings/components/settings-page";

export const metadata = {
    title: "Settings | CallTrack Admin",
};

export default function Page() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Manage application-wide system configuration.
                </p>
            </div>
            <SettingsPage />
        </div>
    );
}
