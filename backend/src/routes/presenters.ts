// backend/src/routes/presenters.ts

import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "@/utils/auth";
import { log, sendError } from "@/utils/logger";
import { getRegistrationWithPinById } from "./registration.service"; // or add a lighter getRegistrationById

const router = Router();

/** owner-or-organizer guard (same semantics as registration.ts ownerOnly) */
function ownerOrOrganizer(req: Request, res: Response, next: NextFunction) {
    const regId = Number(req.params.id);
    const authId = Number((req as any).registrationId);
    const isOrg = Boolean((req as any).isOrganizer);
    if (!authId || Number.isNaN(authId) || (authId !== regId && !isOrg)) {
        sendError(res, 403, "Unauthorized", { id: regId });
        return;
    }
    next();
}

/**
 * GET /api/presenters/:id/photo
 * - Auth required; owner or organizer may access
 * - Organizer gets "download-as-file" via Content-Disposition
 * - Nginx serves the bytes via X-Accel-Redirect (/protected/...)
 */
router.get("/:id/photo", requireAuth, ownerOrOrganizer, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        sendError(res, 400, "Invalid ID", { raw: req.params.id });
        return;
    }

    try {
        // Reuse existing service. We don't return PINs; we only read server-side.
        const [row] = await getRegistrationWithPinById(id);
        const reg = row?.registrations;

        if (!reg) {
            sendError(res, 404, "Registration not found", { id });
            return;
        }

        // You’re already storing a pointer in presenterPicUrl; expect a RELATIVE path like:
        //   presenters/<id>/portrait-<hash>.webp
        const stored = String(reg.presenterPicUrl || "").trim();
        if (!stored) {
            sendError(res, 404, "No presenter photo", { id });
            return;
        }

        // Minimal safety: require a relative path inside our media tree
        // (prevents path traversal and absolute paths)
        if (stored.startsWith("/") || stored.includes("..")) {
            log.warn("Unsafe presenterPicUrl detected", { id, stored });
            sendError(res, 400, "Invalid photo path");
            return;
        }

        // Only organizers (admins) get "download-as-file"
        const isAdmin = Boolean((req as any).isOrganizer);
        if (isAdmin) {
            // You can add a nicer filename if you like
            res.setHeader("Content-Disposition", 'attachment; filename="portrait.webp"');
            // If you need i18n filenames: filename*=UTF-8''<urlencoded>
        }

        // Let nginx serve the file, guarded by /protected alias
        res.setHeader("Cache-Control", "private, max-age=600");
        res.setHeader("X-Accel-Redirect", `/protected/${stored}`);
        return res.status(200).end();

    } catch (err) {
        log.error("Presenter photo fetch failed", { err, id });
        sendError(res, 500, "Failed to fetch photo");
    }
});

export default router;
