import { useMutation } from "@tanstack/react-query";
import { profileApi, UpdatePasswordData } from "@shared/api/profile";
import { toast } from "sonner";
import { ApiError } from "@shared/api/api";

export function useChangePassword() {
    return useMutation({
        mutationFn: (data: UpdatePasswordData) => profileApi.updatePassword(data),
        onSuccess: () => {
            toast.success("Password updated successfully");
        },
        onError: (error: ApiError) => {
            toast.error(error.message || "Failed to update password");
        },
    });
}
