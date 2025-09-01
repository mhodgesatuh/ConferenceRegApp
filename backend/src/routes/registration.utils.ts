// backend/src/routes/registration.utils.ts

import {randomInt} from "crypto";

/** List of required fields for registration create/update validation */
export const REQUIRED_FIELDS = ["email", "lastName", "question1", "question2"] as const;

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
export const toTinyInt = (v: unknown, defaultVal = false): number => (toBool(v, defaultVal) ? 1 : 0);

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

/** Validate both phone fields on a typical body */
export const hasInvalidPhones = (body: { phone1?: unknown; phone2?: unknown }): boolean =>
    !isValidPhone(body.phone1) || !isValidPhone(body.phone2);

/** Lightweight email format validation (RFC5322-lite) */
export const isValidEmail = (email: string): boolean => {
    if (!email) return false;
    if (email.length > 320) return false;

    const at = email.indexOf("@");
    if (at <= 0 || at === email.length - 1) return false;

    const local = email.slice(0, at);
    const domain = email.slice(at + 1);

    if (!local || !domain || domain.includes(" ")) return false;
    if (!domain.includes(".")) return false;

    // Disallow leading/trailing dots or consecutive dots
    return !(
        local.startsWith(".") ||
        local.endsWith(".") ||
        local.includes("..") ||
        domain.startsWith(".") ||
        domain.endsWith(".") ||
        domain.includes("..")
    );
};

/**
 * Determine which required fields are missing.
 * - When `partial` is true, only fields explicitly provided are validated.
 * - `required` defaults to REQUIRED_FIELDS but can be overridden if needed.
 */
export function missingRequiredFields(
    body: Record<string, unknown>,
    partial = false,
    required: readonly string[] = REQUIRED_FIELDS
): string[] {
    return required.filter((field) => {
        const value = (body as any)[field];
        if (partial && value === undefined) return false; // ignore untouched
        if (value === undefined || value === null) return true;
        return String(value).trim() === "";
    });
}

