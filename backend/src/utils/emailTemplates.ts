// backend/src/utils/emailTemplates.ts

import fs from "fs/promises";
import path from "path";

let cachedRsvpTemplate: string | null = null;

export async function loadRsvpTemplate(): Promise<string> {
    if (cachedRsvpTemplate != null) return cachedRsvpTemplate;

    // compiled file lives in dist/utils; go up to dist/, then up to backend/, then assets/
    const distDir = path.resolve(__dirname, "..");
    const backendDir = path.resolve(distDir, "..");
    const assetsDir = path.join(backendDir, "assets");
    const templatePath = path.join(assetsDir, "rsvp-email.txt");

    const text = await fs.readFile(templatePath, "utf8");
    cachedRsvpTemplate = text;
    return text;
}

/**
 * Replaces placeholders in the RSVP email template.
 * Supported tokens:
 *   {#NAME}      – recipient name (or email)
 *   {#RSVP_URL}  – link to RSVP page
 *   {#LOGIN_PIN} – one-time PIN
 */
export function fillRsvpTemplate(
    template: string,
    name: string,
    loginPin: string,
    rsvpUrl: string
): string {
    return template
        .replaceAll("{#NAME}", name)
        .replaceAll("{#RSVP_URL}", rsvpUrl)
        .replaceAll("{#LOGIN_PIN}", loginPin);
}
