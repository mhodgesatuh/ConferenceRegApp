// backend/src/constants/presenters.ts

export const DEFAULT_PRESENTER_MAX_BYTES = 2 * 1024 * 1024; // 2 MiB

/**
 * Read the configured max presenter photo size from the environment and
 * sanitize it so that obviously invalid values fall back to the default.
 */
export function getPresenterMaxBytes(): number {
    const raw = Number(process.env.PRESENTER_MAX_BYTES);
    if (Number.isFinite(raw) && raw > 0) {
        return raw;
    }
    return DEFAULT_PRESENTER_MAX_BYTES;
}

