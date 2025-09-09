// src/features/administration/table/columns.ts
import type { ColumnDef } from "@tanstack/react-table";
import type { FormField } from "@/data/registrationFormData";

export interface RegistrationIndexable {
    [key: string]: any;
}

export function buildListColumnsFromForm<T extends RegistrationIndexable>(
    fields: FormField[]
): ColumnDef<T>[] {
    const SENSITIVE = new Set([
        "password",
        "confirmPassword",
        "pin",
        "loginPin",
        "token",
        "secret",
    ]);
    const EXCLUDED_TYPES = new Set(["password", "hidden", "textarea", "file"]);

    return (fields as any[])
        .filter((f) => {
            const name = f?.name ?? "";
            const type = f?.type ?? "text";
            const list = f?.list; // optional flag on your schema
            if (!name) return false;
            if (SENSITIVE.has(name)) return false;
            if (EXCLUDED_TYPES.has(String(type))) return false;
            if (list === false) return false;
            return true;
        })
        .map((f) => {
            const name = f.name as string;
            const label = f.label ?? name.charAt(0).toUpperCase() + name.slice(1);
            return {
                accessorKey: name,
                header: label,
                cell: ({ getValue }) => {
                    const v = getValue<any>();
                    return v == null ? "" : String(v);
                },
            } as ColumnDef<T>;
        });
}

export function buildFilterKeys(
    dynamicCols: ColumnDef<any>[],
    always: string[] = []
): string[] {
    const keys = new Set<string>(always);
    for (const c of dynamicCols as any[]) {
        const k = c?.accessorKey as string | undefined;
        if (k) keys.add(k);
    }
    return Array.from(keys);
}
