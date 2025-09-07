// frontend/src/lib/api.ts

const CSRF_TOKEN_KEY = "csrfToken";
const CSRF_HEADER_KEY = "csrfHeader";

// Call this once right after a successful login
export function saveCsrf(token: string, header: string) {
    sessionStorage.setItem(CSRF_TOKEN_KEY, token);
    sessionStorage.setItem(CSRF_HEADER_KEY, header);
}

export function clearCsrf() {
    sessionStorage.removeItem(CSRF_TOKEN_KEY);
    sessionStorage.removeItem(CSRF_HEADER_KEY);
}

function readCsrf() {
    return {
        token: sessionStorage.getItem(CSRF_TOKEN_KEY) ?? undefined,
        header: sessionStorage.getItem(CSRF_HEADER_KEY) ?? undefined,
    };
}

/**
 * apiFetch
 * - Sends cookies by default (credentials: 'include')
 * - Sets Content-Type: application/json if there is a body and caller didn't set it
 * - Automatically attaches CSRF header for non-GET requests using values saved via saveCsrf()
 * - Backward compatible: if you still pass `csrf` and `csrfHeader`, those take precedence.
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
    const isFormData = typeof FormData !== "undefined" && opts.body instanceof FormData;

    // JSON content-type if there is a body and caller didn't set it
    if (hasBody && !isFormData && !headers.has("content-type")) {
        headers.set("content-type", "application/json");
    }

    // Prefer explicit args if provided; otherwise use stored CSRF
    const stored = readCsrf();
    const tokenToSend = csrf ?? stored.token;
    const headerToUse = csrf ? csrfHeader : (stored.header || csrfHeader);

    // Only attach CSRF on non-GET methods
    if (tokenToSend && method !== "GET") {
        headers.set(headerToUse, tokenToSend);
    }

    const res = await fetch(path, { credentials: "include", ...opts, headers });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json() : undefined;

    if (!res.ok) {
        // bubble up status + parsed body to callers
        throw Object.assign(new Error("request failed"), { status: res.status, data });
    }

    return data;
}
