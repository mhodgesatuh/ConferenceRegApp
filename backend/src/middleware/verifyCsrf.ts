import type { Request, Response, NextFunction } from "express";
import { sendError } from "@/utils/logger";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function originAllowed(req: Request): boolean {
    const ui = (process.env.UI_ORIGIN || "https://localhost:8080").trim();
    const origin = req.headers.origin as string | undefined;
    const referer = req.headers.referer as string | undefined;

    const url = origin ?? referer;
    if (!url) return false;

    try {
        const o = new URL(url);
        return `${o.protocol}//${o.host}` === ui;
    } catch {
        return false;
    }
}

export function verifyCsrf(req: Request, res: Response, next: NextFunction) {
    if (SAFE_METHODS.has(req.method)) return next();

    // 1) Origin/Referer allow-list
    if (!originAllowed(req)) {
        sendError(res, 403, "Forbidden (origin)");
        return;
    }

    // 2) Compare header token to session token (set by requireAuth)
    const headerToken = (req.headers["x-csrf-token"] as string | undefined)?.trim() || "";
    const sessionToken = (req as any)?.csrf || "";

    if (!headerToken || !sessionToken || headerToken !== sessionToken) {
        sendError(res, 403, "Forbidden (csrf)");
        return;
    }
    next();
}
