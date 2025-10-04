// backend/src/routes/presenters.ts

import { Router, Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import multer, { MulterError } from "multer";
import { requireAuth } from "@/utils/auth";
import { log, sendError } from "@/utils/logger";
import { getRegistrationWithPinById } from "./registration.service"; // or add a lighter getRegistrationById

const router = Router();

const DIST_DIR = path.resolve(__dirname, "..");
const BACKEND_DIR = path.resolve(DIST_DIR, "..");
const ROOT_DIR = path.resolve(BACKEND_DIR, "..");
const rawUploadDir = process.env.UPLOAD_DIR || "data/presenter-photos";
const UPLOAD_ROOT = path.isAbsolute(rawUploadDir)
    ? rawUploadDir
    : path.join(ROOT_DIR, rawUploadDir);

const PHOTO_SUBDIR = "presenters";
const MAX_PHOTO_BYTES = Number(process.env.PRESENTER_MAX_BYTES || 2 * 1024 * 1024); // 2 MiB default
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

class UnsupportedMimeTypeError extends Error {
    public readonly mime: string;

    constructor(mime: string) {
        super("Unsupported mime type");
        this.name = "UnsupportedMimeTypeError";
        this.mime = mime;
    }
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_PHOTO_BYTES },
    fileFilter(_req, file, cb) {
        const mime = (file.mimetype || "").toLowerCase();
        if (!ALLOWED_MIME.has(mime)) {
            cb(new UnsupportedMimeTypeError(mime));
            return;
        }
        cb(null, true);
    },
});

const uploadLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 12,
    standardHeaders: true,
    legacyHeaders: false,
});

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function ensureDirectory(dir: string): Promise<void> {
    await fs.mkdir(dir, { recursive: true });
}

function buildRelativeFilePath(extension: string): { relative: string; absolute: string } {
    const safeExt = extension.replace(/[^a-z0-9.]/gi, "");
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${safeExt}`;
    const relative = path.posix.join(PHOTO_SUBDIR, fileName);
    const absolute = path.join(UPLOAD_ROOT, relative);
    return { relative, absolute };
}

function hasExpectedSignature(buffer: Buffer, mime: string): boolean {
    if (buffer.length === 0) return false;
    switch (mime) {
        case "image/jpeg":
            return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
        case "image/png":
            return buffer.length > 8 &&
                buffer[0] === 0x89 &&
                buffer[1] === 0x50 &&
                buffer[2] === 0x4e &&
                buffer[3] === 0x47 &&
                buffer[4] === 0x0d &&
                buffer[5] === 0x0a &&
                buffer[6] === 0x1a &&
                buffer[7] === 0x0a;
        case "image/webp":
            return buffer.length > 12 &&
                buffer.toString("ascii", 0, 4) === "RIFF" &&
                buffer.toString("ascii", 8, 12) === "WEBP";
        default:
            return false;
    }
}

const singlePhotoUpload = upload.single("photo");

router.post("/photo", uploadLimiter, (req: Request, res: Response) => {
    singlePhotoUpload(req, res, async (err: unknown) => {
        if (err) {
            if (err instanceof UnsupportedMimeTypeError) {
                sendError(res, 400, "Unsupported photo format", { allowed: Array.from(ALLOWED_MIME) });
                return;
            }
            if (err instanceof MulterError && err.code === "LIMIT_FILE_SIZE") {
                sendError(res, 413, "Photo is too large", { maxBytes: MAX_PHOTO_BYTES, maxReadable: formatBytes(MAX_PHOTO_BYTES) });
                return;
            }
            log.warn("Presenter photo upload rejected", { err });
            sendError(res, 400, "Photo could not be processed");
            return;
        }

        const file = (req as any).file as (Express.Multer.File & { buffer: Buffer }) | undefined;

        if (!file) {
            sendError(res, 400, "No photo provided");
            return;
        }

        const buffer = file.buffer;
        const mime = (file.mimetype || "").toLowerCase();

        if (!buffer || buffer.length === 0) {
            sendError(res, 400, "Photo is empty");
            return;
        }

        if (buffer.length > MAX_PHOTO_BYTES) {
            sendError(res, 413, "Photo is too large", { maxBytes: MAX_PHOTO_BYTES, maxReadable: formatBytes(MAX_PHOTO_BYTES) });
            return;
        }

        if (!ALLOWED_MIME.has(mime)) {
            sendError(res, 400, "Unsupported photo format", { allowed: Array.from(ALLOWED_MIME) });
            return;
        }

        if (!hasExpectedSignature(buffer, mime)) {
            log.warn("Presenter photo failed signature check", { mime });
            sendError(res, 400, "Photo appears to be invalid or unsafe");
            return;
        }

        const ext = mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";

        try {
            const { relative, absolute } = buildRelativeFilePath(ext);
            await ensureDirectory(path.dirname(absolute));
            await fs.writeFile(absolute, buffer);

            log.info("Presenter photo stored", { path: relative, size: buffer.length });

            res.status(201).json({ presenterPicUrl: relative, bytes: buffer.length });
        } catch (writeErr) {
            log.error("Presenter photo save failed", { err: writeErr });
            sendError(res, 500, "Failed to save presenter photo");
        }
    });
});

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
