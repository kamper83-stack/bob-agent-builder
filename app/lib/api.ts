/**
 * lib/api.ts
 * ----------
 * Shared API utilities. Centralises the backend base URL so every screen
 * uses the same fallback logic — no duplication across Test / Improve.
 */

export function getApiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return `${base}${path}`;
}
