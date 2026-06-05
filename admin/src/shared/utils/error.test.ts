import { describe, it, expect } from 'vitest';
import { formatValidationErrors, getApiErrorMessage } from './error';

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

  it('should extract validation errors from fetch ApiError data', () => {
    const error = Object.assign(new Error('The given data was invalid.'), {
      status: 422,
      data: {
        message: 'The given data was invalid.',
        errors: {
          date_range: ['Date range cannot exceed 31 days for export.'],
        },
      },
    });

    expect(getApiErrorMessage(error)).toBe(
      'Date range cannot exceed 31 days for export.'
    );
  });

  it('should extract validation errors from axios-style response', () => {
    const error = {
      response: {
        data: {
          message: 'The given data was invalid.',
          errors: {
            start_date: ['The start date field is required.'],
            end_date: ['The end date field is required.'],
          },
        },
      },
    };

    expect(getApiErrorMessage(error)).toBe(
      'The start date field is required. The end date field is required.'
    );
  });

  it('should format validation errors into a single string', () => {
    expect(
      formatValidationErrors({
        export: ['Too many rows (150,001). Narrow your filters.'],
        date_range: ['Date range cannot exceed 31 days for export.'],
      })
    ).toBe(
      'Too many rows (150,001). Narrow your filters. Date range cannot exceed 31 days for export.'
    );
  });
});
