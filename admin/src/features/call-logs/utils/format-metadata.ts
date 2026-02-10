/**
 * Formats call classification metadata for display
 * Handles both object and string metadata, parsing JSON strings if possible
 *
 * @param metadata - The metadata value from call classification
 * @returns Formatted string for display
 */
export function formatClassificationMetadata(
    metadata: unknown
): string {
    // If it's an object (parsed JSON), format nicely
    if (typeof metadata === 'object' && metadata !== null) {
        return formatMetadataObject(metadata as Record<string, unknown>);
    }

    // If it's a string, try to parse as JSON
    if (typeof metadata === 'string') {
        try {
            const parsed = JSON.parse(metadata);
            if (typeof parsed === 'object' && parsed !== null) {
                const formatted = formatMetadataObject(parsed);
                // If formatting succeeded, use it; otherwise return original string
                return formatted || metadata;
            }
        } catch {
            // Not JSON, display as-is
        }
        return metadata;
    }

    // Fallback for other types
    return String(metadata);
}

/**
 * Formats a metadata object into a human-readable string
 * Extracts known fields like block_reason and call_type_code
 *
 * @param obj - The metadata object to format
 * @returns Formatted string or empty string if no known fields found
 */
function formatMetadataObject(obj: Record<string, unknown>): string {
    const parts: string[] = [];

    if ('block_reason' in obj) {
        const blockReason = String(obj.block_reason).replace(/_/g, ' ');
        parts.push(`Blocked: ${blockReason}`);
    }

    if ('call_type_code' in obj) {
        parts.push(`Type code: ${obj.call_type_code}`);
    }

    // If we found known fields, return formatted string
    if (parts.length > 0) {
        return parts.join(' • ');
    }

    // If no known fields, return JSON representation
    return JSON.stringify(obj);
}
