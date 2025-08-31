import type { RequestHandler } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { registrations, credentials } from "@/db/schema";

export const requirePin: RequestHandler = async (req, res, next) => {
  try {
    const email = (req.body?.email ?? req.query?.email ?? "").toString().trim().toLowerCase();
    const pin = (req.body?.pin ?? req.query?.pin ?? "").toString();

    if (!email || !pin) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    const [row] = await db
      .select({ registrationId: credentials.registrationId })
      .from(registrations)
      .innerJoin(credentials, eq(credentials.registrationId, registrations.id))
      .where(and(eq(registrations.email, email), eq(credentials.loginPin, pin)))
      .limit(1);

    if (!row) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    (req as any).registrationAuth = { email, registrationId: row.registrationId };
    next();
  } catch (e) {
    res.status(500).json({ error: "server error" });
  }
};
