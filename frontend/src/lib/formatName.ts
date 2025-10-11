// frontend/src/lib/formatName.ts

export function formatFullName(
    first?: unknown,
    last?: unknown
): string {
    const firstName =
        typeof first === "string" ? first.trim() : "";
    const lastName =
        typeof last === "string" ? last.trim() : "";
    return [firstName, lastName].filter(Boolean).join(" ");
}
