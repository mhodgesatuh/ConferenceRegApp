// backend/src/utils/auth.ts

import { NextFunction, Request, RequestHandler, Response } from "express";
import crypto from "crypto";

/**
 * NOTE: Request type augmentation lives in:
 *   src/types/express-auth.d.ts
 * Do NOT augment Request here to avoid duplicate/unused interface warnings.
 */

/* -------------------------------------------------------------------------------------------------
 * Types & in-memory store
 * ------------------------------------------------------------------------------------------------- */

type Session = {
    registrationId: number;
    isOrganizer: boolean;
    /** absolute epoch ms (server-side expiry) */
    expiresAt: number;
};

const SESSIONS = new Map<string, Session>();
const SESSION_COOKIE = "sessionid";

/* -------------------------------------------------------------------------------------------------
 * Config (env-driven)
 * ------------------------------------------------------------------------------------------------- */

const isProd = process.env.NODE_ENV === "production";

// Session TTL (sanitize invalid env)
const RAW_TTL = Number(process.env.SESSION_TTL_MS);
const DEFAULT_TTL = 60 * 60 * 1000; // 1h
const SESSION_TTL_MS = Number.isFinite(RAW_TTL) && RAW_TTL > 0 ? RAW_TTL : DEFAULT_TTL;

// Cookie flags:
// - For cross-origin dev (Vite -> API), cookies must be SameSite=None and Secure=true.
// - For local http-only dev (rare), set COOKIE_SECURE=false (but then SameSite=None will be rejected by browsers).
const COOKIE_SECURE = (process.env.COOKIE_SECURE ?? "true").toLowerCase() !== "false";
const COOKIE_SAMESITE: "strict" | "none" = isProd ? "strict" : "none";

// One-time startup warning for a common foot-gun
if (COOKIE_SAMESITE === "none" && !COOKIE_SECURE) {
    console.warn("[auth] SameSite=None requires Secure=true; session cookie may be rejected in modern browsers.");
}

/* -------------------------------------------------------------------------------------------------
 * Sweeper for expired sessions (runs once per process)
 * ------------------------------------------------------------------------------------------------- */

const SWEEP_MS = 15 * 60 * 1000; // 15m
if (process.env.NODE_ENV !== "test") {
    setInterval(() => {
        const t = Date.now();
        for (const [sid, s] of SESSIONS) {
            if (s.expiresAt <= t) SESSIONS.delete(sid);
        }
    }, SWEEP_MS).unref?.(); // don't keep the process alive just for the timer
}

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------------------------------- */

const now = (): number => Date.now();

/** Requires cookie-parser mounted in app.ts */
function readSessionId(req: Request): string | undefined {
    return (req as any).cookies?.[SESSION_COOKIE] || undefined;
}

/** Returns a live session and refreshes server-side TTL (sliding expiry) */
function getFreshSession(sid: string | undefined): Session | undefined {
    if (!sid) return undefined;
    const sess = SESSIONS.get(sid);
    if (!sess) return undefined;
    if (sess.expiresAt <= now()) {
        SESSIONS.delete(sid);
        return undefined;
    }
    // Sliding expiration: extend on use
    sess.expiresAt = now() + SESSION_TTL_MS;
    return sess;
}

/* -------------------------------------------------------------------------------------------------
 * Proxy seal (Nginx -> backend)
 * ------------------------------------------------------------------------------------------------- */

export const requireProxySeal: RequestHandler = (req, res, next) => {
    // CORS preflights don't include custom headers (like X-Internal-Secret)
    if (req.method === "OPTIONS") return res.sendStatus(204);

    const expected = (process.env.INTERNAL_SECRET ?? "").trim();
    if (!expected) {
        // In dev, allow direct hits; in prod this is a misconfig
        if (!isProd) return next();
        res.status(500).json({ error: "INTERNAL_SECRET not configured" });
        return;
    }

    const provided = (req.headers["x-internal-secret"] as string | undefined)?.trim() ?? "";
    if (provided !== expected) {
        res.status(401).json({ error: "unauthorized" });
        return;
    }

    next();
};

/* -------------------------------------------------------------------------------------------------
 * Session APIs
 * ------------------------------------------------------------------------------------------------- */

/** Create a new session and set the cookie */
export function createSession(res: Response, registrationId: number, isOrganizer = false) {
    const sid = crypto.randomBytes(16).toString("hex");
    SESSIONS.set(sid, { registrationId, isOrganizer, expiresAt: now() + SESSION_TTL_MS });

    res.cookie(SESSION_COOKIE, sid, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: COOKIE_SAMESITE, // 'none' in dev (cross-origin), 'strict' in prod (same-origin via nginx)
        path: "/",
        maxAge: SESSION_TTL_MS,
    });
}

/**
 * Require an authenticated session.
 * Also refreshes the cookie's expiration (sliding window) when >50% elapsed.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const sid = readSessionId(req);
    const sess = getFreshSession(sid);
    if (!sess) {
        res.status(401).json({ error: "unauthorized" });
        return;
    }

    // Refresh cookie expiry when more than half the TTL has elapsed
    const remaining = sess.expiresAt - now();
    if (sid && remaining < SESSION_TTL_MS / 2) {
        res.cookie(SESSION_COOKIE, sid, {
            httpOnly: true,
            secure: COOKIE_SECURE,
            sameSite: COOKIE_SAMESITE,
            path: "/",
            maxAge: SESSION_TTL_MS,
        });
    }

    req.registrationId = sess.registrationId;
    req.isOrganizer = sess.isOrganizer;
    next();
}

/** Read-only access to the current session (if any) */
export function getSession(req: Request) {
    return getFreshSession(readSessionId(req));
}

/** Destroy the current session and clear the cookie */
export function clearSession(req: Request, res: Response): void {
    const sid = (req as any).cookies?.[SESSION_COOKIE] as string | undefined;
    if (sid) SESSIONS.delete(sid);
    res.clearCookie(SESSION_COOKIE, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: COOKIE_SAMESITE,
        path: "/",
    });
}
