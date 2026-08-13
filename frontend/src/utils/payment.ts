import type { CardBrand } from "../types/payment";

/**
 * Inserts a space every 4 digits as the user types, e.g. "4242 4242 4242 4242".
 * Returns an empty string for empty input.
 */
export function formatCardNumber(value: string): string {
  const digits = (value ?? "").replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

/** Removes all non-digit characters. */
export function digitsOnly(value: string): string {
  return (value ?? "").replace(/\D/g, "");
}

/**
 * Standard Luhn checksum over the card number — mirrors the backend check so
 * the user gets instant feedback before submitting.
 */
export function luhnCheck(cardNumber: string): boolean {
  const digits = digitsOnly(cardNumber);
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }
  let sum = 0;
  let doubleDigit = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
}

/**
 * Derives the card brand from the leading digits (BIN-range detection) — the
 * same logic as the backend. Returns null when unrecognized.
 */
export function detectCardBrand(cardNumber: string): CardBrand | null {
  const digits = digitsOnly(cardNumber);
  if (digits.startsWith("4")) {
    return "VISA";
  }
  if (
    /^(51|52|53|54|55)/.test(digits) ||
    /^(222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(digits)
  ) {
    return "MASTERCARD";
  }
  if (digits.startsWith("34") || digits.startsWith("37")) {
    return "AMEX";
  }
  return null;
}

/** Returns true if the given MM/YY values represent a not-yet-expired date. */
export function isExpiryValid(month: string, year: string): boolean {
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(m) || !Number.isInteger(y) || m < 1 || m > 12) {
    return false;
  }
  const fullYear = y < 100 ? 2000 + y : y;
  const now = new Date();
  const nowMonth = now.getMonth() + 1;
  const nowYear = now.getFullYear();
  return fullYear > nowYear || (fullYear === nowYear && m >= nowMonth);
}

/** Returns true if the CVV is 3 or 4 digits. */
export function isCvvValid(cvv: string): boolean {
  return /^\d{3,4}$/.test(cvv ?? "");
}