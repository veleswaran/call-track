import { describe, it, expect } from 'vitest';
import { getApiErrorMessage } from './error';

describe('getApiErrorMessage', () => {
  it('should extract message from API error response', () => {
    const error = {
      response: {
        data: {
          message: 'API Error Message',
        },
      },
    };
    expect(getApiErrorMessage(error)).toBe('API Error Message');
  });

  it('should use fallback when response data message is missing', () => {
    const error = {
      response: {
        data: {},
      },
    };
    expect(getApiErrorMessage(error)).toBe('An error occurred');
  });

  it('should handle native Error instances', () => {
    const error = new Error('Native Error Message');
    expect(getApiErrorMessage(error)).toBe('Native Error Message');
  });

  it('should use fallback for unknown error types', () => {
    expect(getApiErrorMessage('string error')).toBe('An error occurred');
  });

  it('should use custom fallback message', () => {
    expect(getApiErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
  });

  it('should handle error with response but no data', () => {
    const error = {
      response: null,
    };
    expect(getApiErrorMessage(error)).toBe('An error occurred');
  });
});
