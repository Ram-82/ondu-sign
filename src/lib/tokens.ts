import { randomBytes } from "crypto";

export function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}

export function generateSigningTokenExpiry(days = 7): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
