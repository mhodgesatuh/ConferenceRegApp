// src/features/administration/table/columns.ts

import type { ColumnDef } from "@tanstack/react-table";
import type { FormField } from "@/data/registrationFormData";
import { getAccessorKey } from "./utils";

export interface RegistrationIndexable {
    [key: string]: any;
}

export function buildListColumnsFromForm<T extends RegistrationIndexable>(
    fields: FormField[]
): ColumnDef<T>[] {
    // compare by LOWERCASE
    const SENSITIVE_LOWER = new Set([
        "password",
        "confirmpassword",
        "pin",
        "loginpin",
        "token",
        "secret",
    ]);

    // exclude certain UI-only/unsafe types (lowercased)
    const EXCLUDED_TYPES = new Set(["password", "hidden", "textarea", "file", "section"]);

    return (fields as any[])
        .filter((f) => {
            const name = (f?.name ?? "") as string;
            const type = String(f?.type ?? "text").toLowerCase();
            const list = f?.list; // optional schema flag

            if (!name) return false;

            const nameLower = name.toLowerCase();
            if (SENSITIVE_LOWER.has(nameLower)) return false;
            if (EXCLUDED_TYPES.has(type)) return false;
            if (list === false) return false;

            return true;
        })
        .map((f) => {
            const name = f.name as string;

            return {
                accessorKey: name,
                header: camelToTitle(name),
                cell: ({ getValue }) => {
                    const v = getValue<any>();
                    return v == null ? "" : String(v);
                },
                meta: {
                    clickedByDefault: f.clickedByDefault !== false,
                },
            } as ColumnDef<T>;
        });
}

export function buildFilterKeys(
    dynamicCols: ColumnDef<any>[],
    always: string[] = []
): string[] {
    const keys = new Set<string>(always);
    for (const c of dynamicCols) {
        const k = getAccessorKey(c);
        if (k) keys.add(k);
    }
    return Array.from(keys);
}

/**
 * Convert a camelCase / PascalCase / mixed string (with digits & acronyms)
 * into Title Case with spaces:
 *   loginPIN  -> "Login PIN"
 *   phone1    -> "Phone 1"
 *   firstName -> "First Name"
 *   URLField  -> "URL Field"
 *   login_pin -> "Login Pin"
 */
export function camelToTitle(input: string): string {
    if (!input) return "";

    // Normalize underscores/dashes to spaces first
    input = input.replace(/[_-]+/g, " ");

    // Insert spaces between:
    //  - lower/number -> upper (e.g., "firstName", "phone1A")
    //  - acronym -> Word start (e.g., "URLField" -> "URL Field")
    let s = input
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
        .replace(/(\d+)/g, " $1")
        .trim();

    // Title-case normal words, preserve all-caps acronyms
    s = s
        .split(/\s+/)
        .map((part) =>
            /^[A-Z0-9]{2,}$/.test(part)
                ? part
                : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        )
        .join(" ");

    return s;
}
