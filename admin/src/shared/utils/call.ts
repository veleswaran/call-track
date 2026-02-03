export type CallType = "incoming" | "outgoing" | "missed" | "rejected" | "blocked" | "unknown";
export type CallStatus = "Connected" | "No Answer" | "Missed" | "Rejected" | "Blocked";

/**
 * Derive human-friendly call status based on call_type and duration (seconds)
 * - missed => "Missed"
 * - rejected => "Rejected"
 * - blocked => "Blocked"
 * - incoming/outgoing with duration > 0 => "Connected"
 * - incoming/outgoing with duration = 0 => "No Answer"
 */
export function getCallStatus(call_type: CallType, duration: number): CallStatus {
    if (call_type === "missed") return "Missed";
    if (call_type === "rejected") return "Rejected";
    if (call_type === "blocked") return "Blocked";
    return duration > 0 ? "Connected" : "No Answer";
}

export default getCallStatus;
