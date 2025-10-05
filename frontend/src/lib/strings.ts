export function camelToTitle(input: string): string {
    if (!input) return '';

    // Normalize underscores/dashes to spaces first
    input = input.replace(/[_-]+/g, ' ');

    // Insert spaces between:
    //  - lower/number -> upper (e.g., "firstName", "phone1A")
    //  - acronym -> Word start (e.g., "URLField" -> "URL Field")
    let s = input
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/(\d+)/g, ' $1')
        .trim();

    // Title-case normal words, preserve all-caps acronyms
    s = s
        .split(/\s+/)
        .map((part) =>
            /^[A-Z0-9]{2,}$/.test(part)
                ? part
                : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        )
        .join(' ');

    return s;
}

export function toSnakeCase(input: string): string {
    if (!input) return '';

    return input
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[-\s]+/g, '_')
        .toLowerCase();
}
