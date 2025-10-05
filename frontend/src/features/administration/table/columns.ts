// src/features/administration/table/columns.ts

import type { ColumnDef } from "@tanstack/react-table";
import type { FormField } from "@/data/registrationFormData";
import { camelToTitleCase } from "@/lib/strings";
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
        "pin",
        "loginpin",
        "token",
        "secret",
    ]);

    // exclude certain UI-only/unsafe types (lowercased)
    const EXCLUDED_TYPES = new Set(["password", "hidden", "textarea", "text-area", "file", "section"]);

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
                header: camelToTitleCase(name),
                cell: ({ getValue }) => {
                    const v = getValue<any>();
                    return v == null ? "" : String(v);
                },
                meta: {
                    clickedByDefault: f.clickedByDefault === true,
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
