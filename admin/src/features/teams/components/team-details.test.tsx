import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"; // Import Mock type
import { TeamDetails } from "./team-details";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { teamsApi } from "../api/teams-api";
import { useAuth } from "@features/auth/hooks/use-auth";

// Mocking dependencies
vi.mock("../api/teams-api", () => ({
    teamsApi: {
        getTeam: vi.fn(),
        updateTeam: vi.fn(),
        deleteTeam: vi.fn(),
    },
}));

vi.mock("@features/auth/hooks/use-auth", () => ({
    useAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: vi.fn(() => ({
        push: vi.fn(),
    })),
}));

vi.mock("./team-members-list", () => {
    const TeamMembersList = () => <div data-testid="members-list">Members List</div>;
    TeamMembersList.displayName = "TeamMembersList";
    return { TeamMembersList };
});

vi.mock("./DeleteTeamDialog", () => {
    const DeleteTeamDialog = ({ isOpen, onConfirm }: { isOpen: boolean; onConfirm: () => void }) => 
        isOpen ? (
            <div data-testid="delete-dialog">
                <button onClick={onConfirm} data-testid="confirm-delete">Confirm</button>
            </div>
        ) : null;
    DeleteTeamDialog.displayName = "DeleteTeamDialog";
    return { DeleteTeamDialog };
});

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    Wrapper.displayName = "QueryClientWrapper";
    return Wrapper;
}

describe("TeamDetails", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as Mock).mockReturnValue({ user: { roles: ["admin"] } });
    });

    it("renders loading state", () => {
        (teamsApi.getTeam as Mock).mockReturnValue(new Promise(() => {}));
        render(<TeamDetails teamId={1} />, { wrapper: createWrapper() });
        expect(screen.getByText(/Loading team details.../i)).toBeDefined();
    });

    it("renders error state", async () => {
        (teamsApi.getTeam as Mock).mockRejectedValue(new Error("API Error"));
        render(<TeamDetails teamId={1} />, { wrapper: createWrapper() });
        await waitFor(() => expect(screen.getByText(/Error loading team./i)).toBeDefined());
    });

    it("renders team data and handles editing", async () => {
        const mockTeam = {
            data: {
                id: 1,
                name: "Test Team",
                members_count: 5,
                managers_count: 1,
                created_at: "2024-01-01T00:00:00Z",
            },
        };
        (teamsApi.getTeam as Mock).mockResolvedValue(mockTeam);
        (teamsApi.updateTeam as Mock).mockResolvedValue({ data: { ...mockTeam.data, name: "New Name" } });

        render(<TeamDetails teamId={1} />, { wrapper: createWrapper() });

        await waitFor(() => expect(screen.getByText("Test Team")).toBeDefined());
        expect(screen.getByText("5")).toBeDefined();

        // Start editing
        const editBtn = screen.getByTitle("Edit team name");
        fireEvent.click(editBtn);

        const input = screen.getByDisplayValue("Test Team");
        fireEvent.change(input, { target: { value: "New Name" } });
        
        const saveBtn = screen.getByTitle("Save");
        fireEvent.click(saveBtn);

        await waitFor(() => expect(teamsApi.updateTeam).toHaveBeenCalledWith(1, { name: "New Name" }));
    });

    it("renders delete button only for super-admin", async () => {
        const mockTeam = {
            data: { id: 1, name: "Test Team", created_at: "2024-01-01T00:00:00Z" },
        };
        (teamsApi.getTeam as Mock).mockResolvedValue(mockTeam);

        // Case: regular admin
        const { unmount } = render(<TeamDetails teamId={1} />, { wrapper: createWrapper() });
        await waitFor(() => expect(screen.getByText("Test Team")).toBeDefined());
        expect(screen.queryByTitle("Delete team")).toBeNull();
        unmount();

        // Case: super-admin
        (useAuth as Mock).mockReturnValue({ user: { roles: ["super-admin"] } });
        render(<TeamDetails teamId={1} />, { wrapper: createWrapper() });
        await waitFor(() => expect(screen.getByTitle("Delete team")).toBeDefined());
    });
});
