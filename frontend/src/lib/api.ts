// frontend/src/lib/api.ts

export async function apiFetch(path: string, opts: RequestInit = {}, csrf?: string) {
    const headers = new Headers(opts.headers || {});
    if (!headers.has('content-type')) headers.set('content-type', 'application/json');
    if (csrf) headers.set('x-csrf-token', csrf);
    const res = await fetch(path, {credentials: 'include', ...opts, headers});
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await res.json() : undefined;
    if (!res.ok) throw Object.assign(new Error('request failed'), {status: res.status, data});
    return data;
}
