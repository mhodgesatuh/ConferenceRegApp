// backend/src/utils/email.ts

import {log} from "@/utils/logger";

export async function sendEmail({
    to,
    subject,
    text,
}: {
    to: string;
    subject: string;
    text: string;
}): Promise<void> {
    const user = process.env.SMTP_USER;
    if (!user) {
        throw new Error("SMTP configuration missing");
    }

    // Placeholder for actual email sending logic. Implementations may
    // use nodemailer or any other library. For now we simply log and
    // assume the environment will handle delivery.
    log.info("Simulating email send", {to, subject});
    void text; // suppress unused warning
}
