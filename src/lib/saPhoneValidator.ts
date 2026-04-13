/**
 * South African phone number validator & formatter.
 *
 * Accepted formats:
 *   0XX XXX XXXX     (local)
 *   +27 XX XXX XXXX  (international)
 *   27XXXXXXXXX      (no plus)
 *
 * Valid SA mobile prefixes: 06x, 07x, 08x
 * Valid SA landline prefixes: 01x, 02x, 03x, 04x, 05x
 */

export interface PhoneResult {
  valid: boolean;
  error?: string;
  /** E.164 formatted: +27XXXXXXXXX */
  formatted?: string;
  /** Display formatted: 0XX XXX XXXX */
  display?: string;
  mobile?: boolean;
}

export function validateSaPhone(input: string): PhoneResult {
  // Strip spaces, dashes, parentheses
  let cleaned = input.replace(/[\s\-()]/g, "");

  if (!cleaned) {
    return { valid: false, error: "Phone number is required" };
  }

  // Normalize to local format (0XXXXXXXXX)
  if (cleaned.startsWith("+27")) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("27") && cleaned.length === 11) {
    cleaned = "0" + cleaned.slice(2);
  }

  // Must be 10 digits starting with 0
  if (!/^0\d{9}$/.test(cleaned)) {
    return { valid: false, error: "Enter a valid 10-digit SA phone number (e.g. 082 123 4567)" };
  }

  // Validate prefix
  const prefix = cleaned.substring(0, 3);
  const mobilePrefix = /^0[678]\d$/.test(prefix);
  const landlinePrefix = /^0[1-5]\d$/.test(prefix);

  if (!mobilePrefix && !landlinePrefix) {
    return { valid: false, error: `Unrecognised SA phone prefix: ${prefix}` };
  }

  // Format
  const e164 = "+27" + cleaned.slice(1);
  const display = `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;

  return {
    valid: true,
    formatted: e164,
    display,
    mobile: mobilePrefix,
  };
}
