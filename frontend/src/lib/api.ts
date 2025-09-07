// frontend/src/lib/api.ts

export async function apiFetch(path: string, opts: RequestInit = {}, csrf?: string, csrfHeader = "x-csrf-token") {
    const headers = new Headers(opts.headers || {});
    const hasBody = "body" in opts && opts.body != null;
    const isFormData = typeof FormData !== "undefined" && opts.body instanceof FormData;

    if (hasBody && !isFormData && !headers.has("content-type")) {
        headers.set("content-type", "application/json");
    }
    if (csrf) headers.set(csrfHeader, csrf);

    const res = await fetch(path, { credentials: "include", ...opts, headers });
    const isJson = (res.headers.get("content-type") || "").includes("application/json");
    const data = isJson ? await res.json() : undefined;
    if (!res.ok) throw Object.assign(new Error("request failed"), { status: res.status, data });
    return data;
}
