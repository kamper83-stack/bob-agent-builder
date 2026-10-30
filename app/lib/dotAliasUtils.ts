/**
 * dotAliasUtils.ts
 * ----------------
 * Gmail Dot-Aliasing utilities for QA and automated testing (TypeScript).
 *
 * Gmail ignores ALL dots in the local part, so these are identical in delivery
 * but treated as distinct addresses by most systems:
 *
 *   username@gmail.com
 *   user.name@gmail.com
 *   u.s.e.r.n.a.m.e@gmail.com
 *
 * Use as a fallback when the system under test blocks '+' via a strict regex.
 */

/** Split "user@domain" into [local, domain], stripping existing dots and plus-tags. */
function split(base: string): [string, string] {
  if (!base.includes("@")) throw new Error(`Invalid email address: ${base}`);
  const [rawLocal, domain] = base.split("@") as [string, string];
  const local = rawLocal.replace(/\./g, "").split("+")[0];
  return [local, domain];
}

/**
 * Return the *n*-th dot variant of `base` (0-indexed, deterministic).
 * Wraps around if n >= total number of variants.
 *
 * @param base - Full Gmail address.
 * @param n    - Zero-based index into the variant sequence.
 * @returns    A dot-alias variant string like `"u.ser@gmail.com"`.
 */
export function nthVariant(base: string, n: number): string {
  const [local, domain] = split(base);
  const gaps = local.length - 1;
  const total = (1 << gaps) - 1; // 2^gaps - 1

  if (total < 1) throw new Error(`Local part too short to dot-alias: ${local}`);

  const mask = (n % total) + 1; // 1-based, wraps within [1, total]
  const chars: string[] = [local[0]!];
  for (let i = 0; i < gaps; i++) {
    if (mask & (1 << i)) chars.push(".");
    chars.push(local[i + 1]!);
  }
  return chars.join("") + "@" + domain;
}

/**
 * Return a pseudo-random dot variant of `base`.
 *
 * @param base - Full Gmail address.
 * @param seed - Optional numeric seed for reproducible output in tests.
 * @returns    A random dot-alias variant string.
 */
export function randomVariant(base: string, seed?: number): string {
  const [local, domain] = split(base);
  const gaps = local.length - 1;
  const total = (1 << gaps) - 1;

  if (total < 1) throw new Error(`Local part too short to dot-alias: ${local}`);

  // Simple seeded LCG so output is reproducible when seed is given
  const rngSeed = seed ?? Math.floor(Math.random() * 0xffffffff);
  const mask = 1 + (Math.abs((rngSeed * 1664525 + 1013904223) | 0) % total);

  const chars: string[] = [local[0]!];
  for (let i = 0; i < gaps; i++) {
    if (mask & (1 << i)) chars.push(".");
    chars.push(local[i + 1]!);
  }
  return chars.join("") + "@" + domain;
}

/**
 * Return true if `addressA` and `addressB` are Gmail dot-aliases of each other
 * (same inbox after removing all dots).
 *
 * @example
 *   isDotAliasOf("u.ser@gmail.com", "user@gmail.com") // true
 *   isDotAliasOf("user@gmail.com", "user@outlook.com") // false
 */
export function isDotAliasOf(addressA: string, addressB: string): boolean {
  if (!addressA.includes("@") || !addressB.includes("@")) return false;
  const [localA, domainA] = addressA.toLowerCase().split("@") as [string, string];
  const [localB, domainB] = addressB.toLowerCase().split("@") as [string, string];
  if (domainA !== domainB) return false;
  const normA = localA.replace(/\./g, "").split("+")[0];
  const normB = localB.replace(/\./g, "").split("+")[0];
  return normA === normB;
}

/**
 * Return the count of all possible dot variants for a given local part length.
 * For a local part of N characters: 2^(N-1) - 1 variants.
 */
export function variantCount(base: string): number {
  const [local] = split(base);
  return (1 << (local.length - 1)) - 1;
}
