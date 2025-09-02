import type { Request, Response, NextFunction } from "express";
import { sendError } from "@/utils/logger";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function originAllowed(req: Request): boolean {
    const allowed = (process.env.UI_ORIGIN || "https://localhost:8080").trim();
    const src = (req.headers.origin as string | undefined) ?? (req.headers.referer as string | undefined);
    if (!src) return false;
    try {
        const u = new URL(src);
        return `${u.protocol}//${u.host}` === allowed;
    } catch {
        return false;
    }
}

export function verifyCsrf(req: Request, res: Response, next: NextFunction) {
    if (SAFE_METHODS.has(req.method)) return next();

    if (!originAllowed(req)) {
        sendError(res, 403, "Forbidden (origin)");
        return;
    }

    const headerToken = (req.headers["x-csrf-token"] as string | undefined)?.trim() || "";
    const sessionToken = (req as any)?.csrf || "";
    if (!headerToken || !sessionToken || headerToken !== sessionToken) {
        sendError(res, 403, "Forbidden (csrf)");
        return;
    }
    next();
}
