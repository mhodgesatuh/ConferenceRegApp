// frontend/src/features/administration/utils/formatName.ts

export type NameParts = {
    namePrefix?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    nameSuffix?: string | null;
    fallback?: string | null;
};

export function formatFullName({
    namePrefix,
    firstName,
    lastName,
    nameSuffix,
    fallback,
}: NameParts): string {
    const parts = [namePrefix, firstName, lastName, nameSuffix]
        .map((part) => (part ?? "").trim())
        .filter((part) => part.length > 0);

    const combined = parts.join(" ");
    const fallbackValue = (fallback ?? "").trim();
    return combined || fallbackValue;
}
