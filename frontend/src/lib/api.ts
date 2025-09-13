// frontend/src/lib/api.ts
//
// Defines sessionStorage keys for a CSRF token and its header name.
// - saveCsrf / clearCsrf: persist or remove CSRF values in sessionStorage.
// - readCsrf: internal helper to retrieve saved token + header name.
// - primeCsrf: GETs /api/registrations/csrf (with cookies), then saves { csrf, csrfHeader }.
//
// apiFetch: a safe wrapper around fetch for all API calls.
// - Always includes cookies (credentials: "include").
// - Auto-sets "content-type: application/json" when sending a plain body (not FormData).
// - Attaches the CSRF token on non-GET requests (explicit arg overrides stored values).
// - Dev-only logging of request headers with CSRF value redacted.
// - One-time self-heal: on 403 (and no explicit token), primes CSRF and retries once.
// - Parses JSON responses when applicable; throws on non-OK with { status, data }.
//

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

export async function primeCsrf(): Promise<void> {
    const r = await fetch("/api/registrations/csrf", { credentials: "include" });
    if (!r.ok) throw new Error(`Failed to fetch CSRF: ${r.status}`);
    const { csrf, csrfHeader } = await r.json();
    saveCsrf(csrf, csrfHeader ?? "x-csrf-token");
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
    const method = (opts.method || "GET").toUpperCase();
    const hasBody = "body" in opts && opts.body != null;
    const isForm = typeof FormData !== "undefined" && opts.body instanceof FormData;

    // Try once, and on a 403 do a one-time CSRF prime + retry.
    for (let attempt = 0; attempt < 2; attempt++) {
        const headers = new Headers(opts.headers || {});

        // Default JSON Content-Type if not a FormData
        if (hasBody && !isForm && !headers.has("content-type")) {
            headers.set("content-type", "application/json");
        }

        // Use explicit token if provided; otherwise stored token
        const stored = readCsrf();
        const tokenToSend = csrf ?? stored.token;
        const headerToUse = csrf ? csrfHeader : (stored.header || csrfHeader);

        // Attach CSRF on non-GET
        if (tokenToSend && method !== "GET") {
            headers.set(headerToUse, tokenToSend);
        }

        // Dev logging (redact CSRF)
        if (import.meta.env.DEV) {
            const redacted: Record<string, string> = {};
            headers.forEach((v, k) => {
                redacted[k] = k.toLowerCase().includes("csrf") ? "<redacted>" : v;
            });
            // eslint-disable-next-line no-console
            console.debug("[apiFetch]", { path, method, headers: redacted, attempt });
        }

        const res = await fetch(path, {
            credentials: "include",
            ...opts,
            method,
            headers,
        });

        // One-time CSRF self-heal on 403, but only if caller didn't force a token
        if (res.status === 403 && attempt === 0 && !csrf) {
            try {
                await primeCsrf(); // refresh token bound to current session
            } catch {
                // If priming fails, fall through to normal error handling next
            }
            continue; // retry loop (attempt = 1)
        }

        const contentType = res.headers.get("content-type") || "";
        const isJson = contentType.includes("application/json");
        const data = isJson ? await res.json() : undefined;

        if (!res.ok) {
            throw Object.assign(new Error("request failed"), { status: res.status, data });
        }

        return data;
    }

    // Should never get here, but TS likes a return.
    throw new Error("request failed");
}
