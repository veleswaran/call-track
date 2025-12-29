export type CallType = "incoming" | "outgoing" | "missed";
export type CallStatus = "Connected" | "No Answer" | "Missed";

/**
 * Derive human-friendly call status based on call_type and duration (seconds)
 * - missed => "Missed"
 * - incoming/outgoing with duration > 0 => "Connected"
 * - incoming/outgoing with duration = 0 => "No Answer"
 */
export function getCallStatus(call_type: CallType, duration: number): CallStatus {
    if (call_type === "missed") return "Missed";
    return duration > 0 ? "Connected" : "No Answer";
}

export default getCallStatus;
