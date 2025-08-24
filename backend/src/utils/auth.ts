import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import cookie from "cookie";

interface Session {
  csrf: string;
  registrationId: number;
}

const SESSIONS = new Map<string, Session>();
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "";

export function requireProxySeal(req: Request, res: Response, next: NextFunction) {
  if (req.header("x-internal-secret") !== INTERNAL_SECRET) {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  next();
}

export function createSession(res: Response, registrationId: number) {
  const sid = crypto.randomBytes(16).toString("hex");
  const csrf = crypto.randomBytes(16).toString("hex");
  SESSIONS.set(sid, { csrf, registrationId });
  res.cookie("sessionid", sid, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });
  return csrf;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const cookies = cookie.parse(req.headers.cookie || "");
  const sid = cookies.sessionid;
  const sess = sid && SESSIONS.get(sid);
  if (!sess) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    if (req.header("x-csrf-token") !== sess.csrf) {
      res.status(403).json({ error: "csrf_invalid" });
      return;
    }
    const origin = req.header("origin") || "";
    const allowed = process.env.UI_ORIGIN || "";
    if (!origin || origin !== allowed) {
      res.status(403).json({ error: "origin_invalid" });
      return;
    }
  }

  (req as any).registrationId = sess.registrationId;
  next();
}
