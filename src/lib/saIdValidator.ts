/**
 * South African ID Number Validator
 *
 * Format: YYMMDD SSSS C A Z (13 digits)
 * - YYMMDD = date of birth
 * - SSSS   = sequence (0000-4999 female, 5000-9999 male)
 * - C      = citizenship (0 = SA citizen, 1 = permanent resident)
 * - A      = usually 8 (deprecated race digit)
 * - Z      = Luhn checksum digit
 */

export interface SaIdResult {
  valid: boolean;
  error?: string;
  details?: {
    dateOfBirth: string;
    gender: "male" | "female";
    citizen: boolean;
  };
}

function luhnCheck(id: string): boolean {
  let sum = 0;
  let alternate = false;

  for (let i = id.length - 1; i >= 0; i--) {
    let n = parseInt(id[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}

function parseDate(yy: string, mm: string, dd: string): Date | null {
  const month = parseInt(mm, 10);
  const day = parseInt(dd, 10);
  const yearPart = parseInt(yy, 10);

  if (month < 1 || month > 12) return null;

  // Determine century: if YY > current 2-digit year, assume 1900s
  const currentYear = new Date().getFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100;
  const cutoff = currentYear % 100;
  const fullYear = yearPart > cutoff ? 1900 + yearPart : currentCentury + yearPart;

  const date = new Date(fullYear, month - 1, day);
  // Validate the date is real (handles leap years, 30/31-day months)
  if (
    date.getFullYear() !== fullYear ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  // Must not be in the future
  if (date > new Date()) return null;

  return date;
}

export function validateSaId(id: string): SaIdResult {
  // Strip whitespace/dashes for convenience
  const cleaned = id.replace(/[\s-]/g, "");

  if (!/^\d{13}$/.test(cleaned)) {
    return { valid: false, error: "ID number must be exactly 13 digits" };
  }

  // Parse date of birth
  const yy = cleaned.substring(0, 2);
  const mm = cleaned.substring(2, 4);
  const dd = cleaned.substring(4, 6);
  const date = parseDate(yy, mm, dd);

  if (!date) {
    return { valid: false, error: "Invalid date of birth in ID number" };
  }

  // Citizenship digit
  const citizenDigit = parseInt(cleaned[10], 10);
  if (citizenDigit !== 0 && citizenDigit !== 1) {
    return { valid: false, error: "Invalid citizenship digit (must be 0 or 1)" };
  }

  // Luhn checksum
  if (!luhnCheck(cleaned)) {
    return { valid: false, error: "Invalid checksum — please check the ID number" };
  }

  // Parse gender from sequence
  const sequence = parseInt(cleaned.substring(6, 10), 10);
  const gender: "male" | "female" = sequence >= 5000 ? "male" : "female";

  // Format date as YYYY-MM-DD
  const dateOfBirth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  return {
    valid: true,
    details: {
      dateOfBirth,
      gender,
      citizen: citizenDigit === 0,
    },
  };
}
