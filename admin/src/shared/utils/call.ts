export type CallType = "incoming" | "outgoing" | "missed" | "rejected" | "blocked" | "unknown";
export type CallOutcome = "Connected" | "No Answer" | "Missed";

/**
 * Derive unified call outcome from call_type (Android direction) and duration.
 *
 * Connected = duration > 0 (any direction)
 * Missed = missed | rejected | blocked | (incoming with duration 0)
 * No Answer = outgoing with duration 0
 */
export function getCallOutcome(call_type: CallType, duration: number): CallOutcome {
    if (duration > 0) return "Connected";
    if (call_type === "missed" || call_type === "rejected" || call_type === "blocked" || call_type === "incoming") {
        return "Missed";
    }
    return "No Answer";
}

export default getCallOutcome;
