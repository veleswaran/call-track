import { describe, it, expect } from 'vitest';
import { formatClassificationMetadata } from './format-metadata';

describe('formatClassificationMetadata', () => {
    it('should format object with block_reason field', () => {
        const metadata = {
            block_reason: 'SPAM_DETECTED',
        };

        const result = formatClassificationMetadata(metadata);

        expect(result).toBe('Blocked: SPAM DETECTED');
    });

    it('should format object with call_type_code field', () => {
        const metadata = {
            call_type_code: 3,
        };

        const result = formatClassificationMetadata(metadata);

        expect(result).toBe('Type code: 3');
    });

    it('should format object with both block_reason and call_type_code', () => {
        const metadata = {
            block_reason: 'USER_BLOCKED',
            call_type_code: 5,
        };

        const result = formatClassificationMetadata(metadata);

        expect(result).toBe('Blocked: USER BLOCKED • Type code: 5');
    });

    it('should return JSON.stringify for object with unknown fields', () => {
        const metadata = {
            unknown_field: 'some value',
            another_field: 123,
        };

        const result = formatClassificationMetadata(metadata);

        expect(result).toBe(JSON.stringify(metadata));
    });

    it('should parse and format JSON string with known fields', () => {
        const metadata = JSON.stringify({
            block_reason: 'NETWORK_ERROR',
            call_type_code: 2,
        });

        const result = formatClassificationMetadata(metadata);

        expect(result).toBe('Blocked: NETWORK ERROR • Type code: 2');
    });

    it('should return original string if JSON parsing fails', () => {
        const metadata = 'not a json string';

        const result = formatClassificationMetadata(metadata);

        expect(result).toBe('not a json string');
    });

    it('should return original JSON string if parsed object has no known fields', () => {
        const metadata = JSON.stringify({
            unknown_field: 'value',
        });

        const result = formatClassificationMetadata(metadata);

        // Should return original string since formatted result would be empty
        expect(result).toBe(metadata);
    });

    it('should convert non-string, non-object types to string', () => {
        expect(formatClassificationMetadata(123)).toBe('123');
        expect(formatClassificationMetadata(true)).toBe('true');
        expect(formatClassificationMetadata(null)).toBe('null');
    });

    it('should handle empty object', () => {
        const metadata = {};

        const result = formatClassificationMetadata(metadata);

        expect(result).toBe('{}');
    });

    it('should replace underscores with spaces in block_reason', () => {
        const metadata = {
            block_reason: 'SOME_LONG_REASON_NAME',
        };

        const result = formatClassificationMetadata(metadata);

        expect(result).toBe('Blocked: SOME LONG REASON NAME');
    });
});
