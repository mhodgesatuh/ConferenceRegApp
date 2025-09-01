// backend/src/middleware/requirePin.ts

import type { RequestHandler } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { registrations, credentials } from "@/db/schema";
import { checkLimit, recordFailure, resetCounter } from "./emailIpLimiter";

export const requirePin: RequestHandler = async (req, res, next) => {
    try {
        const email = (req.body?.email ?? req.query?.email ?? "").toString().trim().toLowerCase();
        const pin = (req.body?.pin ?? req.query?.pin ?? "").toString().trim();
        const ip = (req.ip ?? "").toString();

        if (!email || !pin) {
            res.status(401).json({ error: "unauthorized" });
            return;
        }

        // Block early if (email, ip) is currently rate-limited
        const limit = checkLimit(email, ip);
        if ("ok" in limit && !limit.ok) {
            const retrySec = Math.ceil(limit.retryAfterMs / 1000);
            res.setHeader("Retry-After", String(retrySec));
            res.status(429).json({ error: "Service interruption: try again later", retryAfterSeconds: retrySec });
            return;
        }

        // PIN check
        const [row] = await db
            .select({ registrationId: credentials.registrationId })
            .from(registrations)
            .innerJoin(credentials, eq(credentials.registrationId, registrations.id))
            .where(and(eq(registrations.email, email), eq(credentials.loginPin, pin)))
            .limit(1);

        if (!row) {
            // Count only failed attempts
            recordFailure(email, ip);
            res.status(401).json({ error: "unauthorized" });
            return;
        }

        // Success → clear counters for this (email, ip)
        resetCounter(email, ip);

        (req as any).registrationAuth = { email, registrationId: row.registrationId };
        next();
    } catch (e) {
        res.status(500).json({ error: "server error" });
    }
};
