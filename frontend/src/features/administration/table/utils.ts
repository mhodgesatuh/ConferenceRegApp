// src/features/administration/table/utils.ts

import type { ColumnDef } from "@tanstack/react-table";

export function getAccessorKey<T>(col: ColumnDef<T, any>): string | undefined {
    const k = (col as any).accessorKey; // runtime-safe read
    return typeof k === "string" ? k : undefined;
}
