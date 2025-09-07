// backend/src/utils/logger.ts

import {Logger} from "tslog";
import fs from "fs";
import path from "path";
import type {NextFunction, Request, Response} from "express";

/** --- paths & config --- */
// Always put logs in the shared top-level logs/ directory
const BACKEND_DIR = path.resolve(__dirname, "..");          // /.../backend/dist/utils → /.../backend
const ROOT_DIR = path.resolve(BACKEND_DIR, "..");           // repo root (ConferenceRegApp)
const rawLogDir = process.env.LOG_DIR || "logs";
const LOG_DIR = path.isAbsolute(rawLogDir)
    ? rawLogDir
    : path.join(ROOT_DIR, rawLogDir);                         // ../logs sibling to backend

const LOG_PREFIX = process.env.LOG_PREFIX || "app";

// Ensure directory exists
fs.mkdirSync(LOG_DIR, { recursive: true });

const filePath = path.join(LOG_DIR, `${LOG_PREFIX}.log`);
const stream = fs.createWriteStream(filePath, { flags: "a" });

// Print for confirmation on startup
// eslint-disable-next-line no-console
console.log(`[logger] writing to: ${filePath}`);

/** --- level mapping --- */
const levelMap = { silly: 0, trace: 1, debug: 2, info: 3, warn: 4, error: 5, fatal: 6 } as const;
type LevelName = keyof typeof levelMap;
const LOG_LEVEL = ((process.env.LOG_LEVEL || "debug").toLowerCase() as LevelName);
const MIN_LEVEL = levelMap[LOG_LEVEL] ?? levelMap.debug;

/** --- tslog instance --- */
export const log = new Logger({ name: "app", minLevel: MIN_LEVEL });

/** --- transport: write formatted lines to file --- */
log.attachTransport((raw: unknown) => {
    const o = raw as Record<string, unknown> & {
        _meta?: { date?: unknown; logLevelName?: string; name?: string };
    };

    const meta = o._meta ?? {};
    const d = meta.date instanceof Date
        ? meta.date
        : (typeof meta.date === "string" || typeof meta.date === "number")
            ? new Date(meta.date)
            : new Date();

    const ts = d.toLocaleString("en-US", {
        timeZone: "Pacific/Honolulu",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false,
    });

    const level = String(meta.logLevelName ?? "").toUpperCase().padEnd(5);
    const logger = meta.name ?? "app";
    const msg = Object.keys(o)
        .filter((k) => k !== "_meta")
        .sort()
        .map((k) => {
            const a = o[k];
            if (typeof a === "string") return a;
            try {
                return JSON.stringify(a);
            } catch {
                return String(a);
            }
        })
        .join(" ");

    stream.write(`[${ts}] ${level} ${logger} ${msg}\n`);
});

/** --- express helpers --- */
export function requestLogger() {
    return (req: Request, _res: Response, next: NextFunction) => {
        log.info("HTTP", { method: req.method, path: req.originalUrl });
        next();
    };
}

export function errorLogger() {
    return (err: unknown, req: Request, res: Response, _next: NextFunction) => {
        log.error("Unhandled error", {
            method: req.method,
            path: req.originalUrl,
            cause: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
        });
        res.status(500).json({ error: "Internal server error" });
    };
}

export function sendError(
    res: Response,
    status: number,
    error: string,
    extra?: Record<string, unknown>
): void {
    const payload = { error, ...(extra ?? {}) };
    res.set("Content-Type", "application/json; charset=utf-8");
    res.status(status).send(JSON.stringify(payload));
}
