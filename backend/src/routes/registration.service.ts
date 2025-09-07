// backend/src/routes/registration.service.ts

import {db} from "@/db/client";
import {credentials, registrations} from "@/db/schema";
import {and, eq} from "drizzle-orm";
import {sql} from "drizzle-orm/sql";
import {sendEmail} from "@/utils/email";

export async function createRegistration(values: any, loginPin: string) {
    return db.transaction<{ id: number }>(async (tx) => {
        // Insert and normalize the new id across possible shapes
        const ret = await tx.insert(registrations).values(values).$returningId();

        let newId: number | undefined =
            Array.isArray(ret)
                ? (typeof ret[0] === "number" ? ret[0] : (ret[0] as any)?.id)
                : (ret as any)?.id;

        // Fallback: LAST_INSERT_ID() if $returningId() didn't produce an id
        if (!newId) {
            const [row] = await tx.execute(sql`SELECT LAST_INSERT_ID() AS id`);
            newId =
                (Array.isArray(row) ? (row as any)[0]?.id : (row as any)?.id) ??
                (row as any)?.id;
        }

        if (!newId) {
            throw new Error("insert_failed");
        }

        // Create credential row (will only run if the insert above succeeded)
        await tx.insert(credentials).values({ registrationId: newId, loginPin });

        return { id: newId };
    });
}


export type LostPinResult =
    | { ok: true }
    | { ok: false; code: "not_found_registration" | "not_found_credential" };

export async function sendLostPinEmail(email: string): Promise<LostPinResult> {
    const [registration] = await getRegistrationByEmail(email);
    if (!registration) return { ok: false, code: "not_found_registration" };

    const [credential] = await getCredentialByRegId(registration.id);
    if (!credential) return { ok: false, code: "not_found_credential" };

    await sendEmail({
        to: email,
        subject: "Your login PIN",
        text: `Your login PIN is ${credential.loginPin}`,
    });

    return { ok: true };
}

export async function updateRegistration(id: number, cleanValues: Record<string, unknown>) {
    const result = await db.update(registrations).set(cleanValues).where(eq(registrations.id, id));
    const rowsAffected =
        (result as any)?.affectedRows ??
        (result as any)?.rowsAffected ??
        0;
    return { rowsAffected };
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
        .where(and(eq(registrations.email, email), eq(credentials.loginPin, pin)))
        .limit(1);
}

export async function getRegistrationByEmail(email: string) {
    return db.select().from(registrations).where(eq(registrations.email, email))
        .limit(1);
}

export async function getCredentialByRegId(registrationId: number) {
    return db.select().from(credentials).where(eq(credentials.registrationId, registrationId))
        .limit(1);
}
