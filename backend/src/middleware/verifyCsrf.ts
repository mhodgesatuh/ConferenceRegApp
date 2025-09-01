// backend/src/middleware/verifyCsrf.ts

import type { Request, Response, NextFunction } from "express";
import { sendError } from "@/utils/logger"; // your sendError helper

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Option 1: keep a small allowlist. Include your public UI origins.
const TRUSTED_ORIGINS = new Set<string>([
    "https://your-ui.example.com",
    "http://localhost:3000",   // dev
    "http://127.0.0.1:3000",   // dev
]);

function originAllowed(req: Request): boolean {
    const origin = req.headers.origin as string | undefined;
    const referer = req.headers.referer as string | undefined;

    // Prefer Origin if present; fall back to Referer’s origin.
    const url = origin ?? referer;
    if (!url) return false;

    try {
        const o = new URL(url);
        return TRUSTED_ORIGINS.has(`${o.protocol}//${o.host}`);
    } catch {
        return false;
    }
}

export function verifyCsrf(req: Request, res: Response, next: NextFunction) {
    if (SAFE_METHODS.has(req.method)) return next();

    // 1) Check site origin for non-GETs
    if (!originAllowed(req)) {
        sendError(res, 403, "Forbidden (origin)");
        return;
    }

    // 2) Compare token from header to server-side session token
    //    Adjust this to match wherever you store the token in `createSession`.
    const headerToken = (req.headers["x-csrf-token"] as string | undefined)?.trim() || "";
    const sessionToken =
        // examples (pick one that matches your code):
        (req as any)?.session?.csrf ||
        (req as any)?.registrationAuth?.csrf ||
        (req as any)?.csrf ||
        "";

    if (!headerToken || !sessionToken || headerToken !== sessionToken) {
        sendError(res, 403, "Forbidden (csrf)");
        return;
    }

    return next();
}
