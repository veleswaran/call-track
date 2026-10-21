import crypto from 'crypto';

export function normalizePhoneNumber(phone: string, defaultCountryCode = '+91'): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
  }

  if (/^\+\d{8,15}$/.test(cleaned)) {
    return cleaned;
  }

  const countryDigits = defaultCountryCode.replace(/^\+/, '');
  if (new RegExp(`^${countryDigits}\\d{6,12}$`).test(cleaned)) {
    return '+' + cleaned;
  }

  if (/^\d{10}$/.test(cleaned)) {
    return defaultCountryCode + cleaned;
  }

  const digits = cleaned.replace(/\D/g, '');
  return digits ? `+${digits}` : '';
}

export function hashString(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function generateRandomToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
