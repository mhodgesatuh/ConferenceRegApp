// frontend/src/lib/api.ts

const CSRF_TOKEN_KEY = "csrfToken";
const CSRF_HEADER_KEY = "csrfHeader";

// Save CSRF token + header name (called once right after successful login)
export function saveCsrf(token: string, header: string) {
    sessionStorage.setItem(CSRF_TOKEN_KEY, token);
    sessionStorage.setItem(CSRF_HEADER_KEY, header);
}

// Clear CSRF values (call this on logout or session timeout)
export function clearCsrf() {
    sessionStorage.removeItem(CSRF_TOKEN_KEY);
    sessionStorage.removeItem(CSRF_HEADER_KEY);
}

// Internal: read CSRF values from sessionStorage
function readCsrf() {
    return {
        token: sessionStorage.getItem(CSRF_TOKEN_KEY) ?? undefined,
        header: sessionStorage.getItem(CSRF_HEADER_KEY) ?? undefined,
    };
}

/**
 * apiFetch
 * - Always sends cookies (credentials: 'include')
 * - Automatically sets Content-Type: application/json if a plain body is provided
 * - Attaches CSRF token/header for non-GET requests (using saved values from saveCsrf)
 * - Explicit csrf/csrfHeader args still override stored values (backward compatible)
 */
export async function apiFetch(
    path: string,
    opts: RequestInit = {},
    csrf?: string,
    csrfHeader = "x-csrf-token"
) {
    const headers = new Headers(opts.headers || {});
    const method = (opts.method || "GET").toUpperCase();
    const hasBody = "body" in opts && opts.body != null;
    const isFormData =
        typeof FormData !== "undefined" && opts.body instanceof FormData;

    // Default to JSON content-type if not already provided
    if (hasBody && !isFormData && !headers.has("content-type")) {
        headers.set("content-type", "application/json");
    }

    // Prefer explicit args if provided; otherwise fall back to stored CSRF
    const stored = readCsrf();
    const tokenToSend = csrf ?? stored.token;
    const headerToUse = csrf ? csrfHeader : stored.header || csrfHeader;

    // Attach CSRF token on non-GET requests
    if (tokenToSend && method !== "GET") {
        headers.set(headerToUse, tokenToSend);
    }

    const res = await fetch(path, {
        credentials: "include",
        ...opts,
        headers,
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json() : undefined;

    if (!res.ok) {
        // Attach status + parsed error body to the thrown Error
        throw Object.assign(new Error("request failed"), {
            status: res.status,
            data,
        });
    }

    return data;
}
