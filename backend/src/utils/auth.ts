// backend/src/utils/auth.ts

import {NextFunction, Request, RequestHandler, Response} from "express";
import crypto from "crypto";
import cookie from "cookie";

interface Session {
    registrationId: number;
}

const SESSIONS = new Map<string, Session>();
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "";

export const requireProxySeal: RequestHandler = (req, res, next) => {
    const expected = (process.env.INTERNAL_SECRET ?? "").trim();
    const provided = (req.headers["x-internal-secret"] as string | undefined)?.trim() ?? "";

    if (!expected) {
        res.status(500).json({ error: "INTERNAL_SECRET not configured" });
        return; // <- return void, not Response
    }

    if (provided !== expected) {
        // optional diag
        // console.warn("proxy seal mismatch", { expectedLen: expected.length, providedLen: provided.length });
        res.status(401).json({ error: "unauthorized" });
        return; // <- return void
    }

    next();
};

export function createSession(res: Response, registrationId: number) {
    const sid = crypto.randomBytes(16).toString("hex");
    SESSIONS.set(sid, { registrationId });
    res.cookie("sessionid", sid, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
    });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const cookies = cookie.parse(req.headers.cookie || "");
    const sid = cookies.sessionid;
    const sess = sid && SESSIONS.get(sid);
    if (!sess) {
        res.status(401).json({ error: "unauthorized" });
        return;
    }
    // Expose to downstream
    (req as any).registrationId = sess.registrationId;
    next();
}
