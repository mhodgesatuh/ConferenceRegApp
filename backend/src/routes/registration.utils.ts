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
export const toBool = (v: unknown, defaultVal = false): boolean => {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    if (typeof v === "string") {
        const s = v.trim().toLowerCase();
        if (["false", "0", "off", "no"].includes(s)) return false;
        if (["true", "1", "on", "yes"].includes(s)) return true;
    }
    return v == null ? defaultVal : Boolean(v);
};

/** Convert arbitrary truthy/falsey input to 1/0 for DB */
export const toTinyInt = (v: unknown, defaultVal = false): number =>
    toBool(v, defaultVal) ? 1 : 0;

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
