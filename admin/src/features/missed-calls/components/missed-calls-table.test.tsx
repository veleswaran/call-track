import { render, screen } from "@testing-library/react";
import { MissedCallsTable } from "./missed-calls-table";
import { CallEscalation, EscalationStatus } from "../types/escalation";
import { describe, it, expect } from "vitest";

describe("MissedCallsTable", () => {
    it("renders loading state", () => {
        render(<MissedCallsTable data={[]} isLoading={true} />);
        expect(screen.getByText("Loading escalations...")).toBeInTheDocument();
    });

    it("renders empty state", () => {
        render(<MissedCallsTable data={[]} isLoading={false} />);
        expect(screen.getByText("No missed calls found for current filters.")).toBeInTheDocument();
    });

    it("renders call escalation rows with different statuses and details", () => {
        const mockEscalations: CallEscalation[] = [
            {
                id: 1,
                call_log_id: 101,
                call_log: {
                    id: 101,
                    agent_name: "Agent Smith",
                    phone_number: "+1234567890",
                    phone_contact_name: "John Doe",
                    timestamp: "2026-03-01T10:00:00Z",
                    type: "missed",
                    duration: 0,
                },
                status: "pending",
                response_due_at: "2026-03-01T11:00:00Z",
                resolved_at: null,
                created_at: "2026-03-01T10:00:00Z",
                updated_at: "2026-03-01T10:00:00Z",
            },
            {
                id: 2,
                call_log_id: 102,
                call_log: {
                    id: 102,
                    agent_name: "",
                    phone_number: "+9876543210",
                    phone_contact_name: null,
                    timestamp: "2026-03-01T12:00:00Z",
                    type: "missed",
                    duration: 0,
                },
                status: "unattended",
                response_due_at: "2026-03-01T13:00:00Z",
                resolved_at: "2026-03-01T13:30:00Z",
                created_at: "2026-03-01T12:00:00Z",
                updated_at: "2026-03-01T13:30:00Z",
            },
            {
                id: 3,
                call_log_id: 103,
                call_log: {
                    id: 103,
                    agent_name: "Agent Carol",
                    phone_number: "+5555555555",
                    phone_contact_name: null,
                    timestamp: "2026-03-01T14:00:00Z",
                    type: "missed",
                    duration: 0,
                },
                status: "resolved",
                response_due_at: "2026-03-01T15:00:00Z",
                resolved_at: "2026-03-01T14:30:00Z",
                created_at: "2026-03-01T14:00:00Z",
                updated_at: "2026-03-01T14:30:00Z",
            },
            {
                id: 4,
                call_log_id: 104,
                call_log: {
                    id: 104,
                    agent_name: "Agent Dave",
                    phone_number: "+4444444444",
                    phone_contact_name: null,
                    timestamp: "2026-03-01T16:00:00Z",
                    type: "missed",
                    duration: 0,
                },
                status: "custom_status" as unknown as EscalationStatus,
                response_due_at: "2026-03-01T17:00:00Z",
                resolved_at: null,
                created_at: "2026-03-01T16:00:00Z",
                updated_at: "2026-03-01T16:00:00Z",
            },
        ];

        render(<MissedCallsTable data={mockEscalations} isLoading={false} />);

        expect(screen.getByText("Agent Smith")).toBeInTheDocument();
        expect(screen.getByText("+1234567890")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Pending")).toBeInTheDocument();

        // Unknown agent fallback
        expect(screen.getByText("Unknown Agent")).toBeInTheDocument();
        expect(screen.getByText("Unattended")).toBeInTheDocument();
        expect(screen.getByText("Resolved")).toBeInTheDocument();
        expect(screen.getByText("custom_status")).toBeInTheDocument();
        expect(screen.getAllByText("via Outgoing Call").length).toBe(2);
    });
});
