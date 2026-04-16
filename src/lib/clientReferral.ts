/**
 * Client-to-client referral code helpers. Mirrors the Ranger helpers in
 * src/lib/referral.ts but scoped to the `cref` URL param so the two flows
 * can coexist on the same signup (someone referred by BOTH a Ranger AND
 * a friend should keep both attributions).
 */

const STORAGE_KEY = "bion_cref_code";

export function getStoredCrefCode(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredCrefCode(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* ignore — private-mode / storage-full */
  }
}

export function clearStoredCrefCode(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
