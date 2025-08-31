// backend/src/routes/registration.service.ts

import { db } from "@/db/client";
import { credentials, registrations } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function createRegistration(values: any, loginPin: string) {
    return db.transaction<{ id: number }>(async (tx) => {
        // Prevent duplicate registrations by email
        const [existing] = await tx
            .select({ id: registrations.id })
            .from(registrations)
            .where(eq(registrations.email, values.email))
            .limit(1);

        if (existing) {
            throw new Error("duplicate_email");
        }

        const result = await tx.insert(registrations).values(values);
        const insertId = (result as unknown as { insertId?: number })?.insertId;
        const newId = typeof insertId === "number" && insertId > 0 ? insertId : undefined;

        if (!newId) {
            throw new Error("insert_failed");
        }

        await tx.insert(credentials).values({ registrationId: newId, loginPin });
        return { id: newId };
    });
}

export async function updateRegistration(id: number, cleanValues: Record<string, unknown>) {
    return db.update(registrations).set(cleanValues).where(eq(registrations.id, id));
}

export async function getRegistrationWithPinById(id: number) {
    return db
        .select()
        .from(registrations)
        .innerJoin(credentials, eq(credentials.registrationId, registrations.id))
        .where(eq(registrations.id, id))
        .limit(1);
}

export async function getRegistrationWithPinByLogin(email: string, pin: string) {
    return db
        .select()
        .from(registrations)
        .innerJoin(credentials, eq(credentials.registrationId, registrations.id))
        .where(and(eq(registrations.email, email), eq(credentials.loginPin, pin)));
}

export async function getRegistrationByEmail(email: string) {
    return db.select().from(registrations).where(eq(registrations.email, email));
}

export async function getCredentialByRegId(registrationId: number) {
    return db.select().from(credentials).where(eq(credentials.registrationId, registrationId));
}
