// backend/src/routes/registration.utils.ts

import { randomInt } from "crypto";

/** Generate a numeric PIN of given length (allows leading zeros). */
export function generatePin(length: number = 8): string {
    let pin = "";
    for (let i = 0; i < length; i++) {
        pin += String(randomInt(0, 10)); // cryptographically stronger than Math.random()
    }
    return pin;
}

/** Normalize booleans (MariaDB tinyint(1)) */
export const toBool = (v: unknown, defaultVal = false) =>
    typeof v === "boolean" ? v : v == null ? defaultVal : Boolean(v);

/** Normalize strings to null if blank */
export const toNull = (v: unknown) => {
    if (v == null) return null;
    const s = String(v).trim();
    return s.length === 0 ? null : s;
};

/** Phone validation (only when present). Empty → allowed (saved as NULL) */
export const isValidPhone = (v: unknown): boolean => {
    const s = toNull(v);
    if (s === null) return true; // empty/blank is allowed
    const digits = s.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
};
