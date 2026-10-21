import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import crypto from 'crypto';

export function generateTwoFactorSecret(appName = 'CallTrack AI', userEmail = ''): {
  secret: string;
  otpauthUrl: string;
} {
  const secretObj = speakeasy.generateSecret({
    name: `${appName} (${userEmail})`,
    issuer: appName,
    length: 20,
  });

  return {
    secret: secretObj.base32,
    otpauthUrl: secretObj.otpauth_url || '',
  };
}

export async function generateQrCodeUrl(otpauthUrl: string): Promise<string> {
  return qrcode.toDataURL(otpauthUrl);
}

export function verifyTwoFactorToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2,
  });
}

export function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(5).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 5)}-${code.slice(5)}`);
  }
  return codes;
}
