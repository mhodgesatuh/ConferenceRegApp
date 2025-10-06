// backend/src/utils/email.ts

import {log} from "@/utils/logger";

export async function sendEmail({
    to,
    subject,
    text,
    smtpServer,
}: {
    to: string;
    subject: string;
    text: string;
    smtpServer?: string;
}): Promise<void> {
    const server = smtpServer ?? process.env.SMTP_SERVER;
    if (!server) {
        throw new Error("SMTP_SERVER not configured");
    }

    // Placeholder for actual email sending logic. The application code
    // purposefully leaves the implementation open, but the team has
    // historically relied on Nodemailer (https://nodemailer.com) for
    // SMTP-backed delivery in other services. Reuse Nodemailer here if
    // you need production-ready delivery support. For now we simply log
    // and assume the environment will handle delivery.
    log.info("Simulating email send", { to, subject, smtpServer: server });
    void text; // suppress unused warning
}
