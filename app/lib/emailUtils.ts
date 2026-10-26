/**
 * emailUtils.ts
 * -------------
 * Utilities for generating unique test email addresses using Gmail
 * sub-addressing (Plus-Aliasing): username+tag@gmail.com routes to
 * username@gmail.com.
 *
 * Usage:
 *   import { uniqueEmail, dotAliasEmail, bulkUniqueEmails } from "@/lib/emailUtils";
 *
 *   const addr = uniqueEmail("user@gmail.com");
 *   // → "user+a1b2c3d4@gmail.com"
 */

/**
 * Return a unique plus-alias for `base`.
 *
 * @param base - Full Gmail address, e.g. `"user@gmail.com"`.
 * @param tag  - Optional fixed tag. Omit to generate a random 8-char hex suffix.
 * @returns    Address like `"user+a1b2c3d4@gmail.com"`.
 */
export function uniqueEmail(base: string, tag?: string): string {
  if (!base.includes("@")) throw new Error(`Invalid email address: ${base}`);

  const [rawLocal, domain] = base.split("@") as [string, string];
  const local = rawLocal.split("+")[0]; // strip any existing plus-tag
  const suffix = tag ?? randomHex(8);
  return `${local}+${suffix}@${domain}`;
}

/**
 * Return a dot-alias variant of `base`.
 * Gmail ignores dots in the local part, but most systems treat it as a new address.
 * Use as a fallback when the target system's email regex blocks `+`.
 *
 * @param base - Full Gmail address, e.g. `"username@gmail.com"`.
 * @param seed - Optional numeric seed for reproducible output in tests.
 * @returns    Address like `"u.sername@gmail.com"`.
 */
export function dotAliasEmail(base: string, seed?: number): string {
  if (!base.includes("@")) throw new Error(`Invalid email address: ${base}`);

  const [rawLocal, domain] = base.split("@") as [string, string];
  const local = rawLocal.split("+")[0];

  if (local.length < 2) {
    throw new Error(`Local part too short to dot-alias: ${local}`);
  }

  // Insert dot after a pseudo-random position (deterministic when seed given)
  const pos = seededInt(seed ?? simpleHash(local), 1, local.length - 1);
  const aliased = local.slice(0, pos) + "." + local.slice(pos);
  return `${aliased}@${domain}`;
}

/**
 * Return `count` unique plus-alias addresses derived from `base`.
 * Handy for seeding parallel test runs.
 *
 * @param base  - Full Gmail address.
 * @param count - Number of addresses to generate (>= 1).
 * @returns     Array of addresses like `["user+00000001@gmail.com", ...]`.
 */
export function bulkUniqueEmails(base: string, count: number): string[] {
  if (count < 1) throw new Error("count must be >= 1");
  const [rawLocal, domain] = base.split("@") as [string, string];
  const local = rawLocal.split("+")[0];
  return Array.from({ length: count }, (_, i) =>
    `${local}+${(i + 1).toString(16).padStart(8, "0")}@${domain}`
  );
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function randomHex(length: number): string {
  const bytes = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length);
}

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function seededInt(seed: number, min: number, max: number): number {
  // Simple LCG for deterministic output without an external library
  const val = (seed * 1664525 + 1013904223) & 0xffffffff;
  return min + (Math.abs(val) % (max - min + 1));
}
