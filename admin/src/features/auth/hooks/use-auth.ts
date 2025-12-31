import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@shared/api/auth-service";
import { User } from "@shared/types";
import { useRouter } from "next/navigation";

export function useAuth() {
    const queryClient = useQueryClient();
    const router = useRouter();

    const { data: user, isLoading, error } = useQuery({
        queryKey: ["user"],
        queryFn: () => authService.getCurrentUser(),
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const logoutMutation = useMutation({
        mutationFn: () => authService.logout(),
        onSuccess: () => {
            queryClient.setQueryData(["user"], null);
            router.push("/login");
        },
    });

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        logout: logoutMutation.mutate,
        isLoggingOut: logoutMutation.isPending,
        mutate: () => queryClient.invalidateQueries({ queryKey: ["user"] }),
    };
}
