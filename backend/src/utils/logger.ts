// backend/src/logger.ts
//

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import type { Request, Response, NextFunction } from "express";
import { Logger as TsLogger, type ILogObj } from "tslog";

dotenv.config();

/** ---------- env & paths ---------- */
const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), "logs");
const LOG_TO_FILE = String(process.env.LOG_TO_FILE ?? "true").toLowerCase() === "true";
const LOG_PREFIX = process.env.LOG_PREFIX || "app";
const LOG_LEVEL = (process.env.LOG_LEVEL || "info").toLowerCase();

/** Map common level names → tslog numeric levels */
const levelMap: Record<string, number> = {
    silly: 0,
    trace: 1,
    debug: 2,
    info: 3,
    warn: 4,
    error: 5,
    fatal: 6,
};
const minLevel = levelMap[LOG_LEVEL] ?? levelMap.info;

/** ---------- logger ---------- */
export const log = new TsLogger<ILogObj>({
    name: LOG_PREFIX,
    minLevel,
    type: "pretty",
});

/** optional file transport (JSON lines) */
if (LOG_TO_FILE) {
    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    const logFilePath = path.join(LOG_DIR, `${LOG_PREFIX}.log`);
    const stream = fs.createWriteStream(logFilePath, { flags: "a" });

    // v4: attachTransport(callback) — meta is inside logObj._meta
    log.attachTransport((logObj) => {
        // logObj has an internal _meta object with date, level, etc.
        const meta = (logObj as any)?._meta ?? {};
        const line = JSON.stringify({
            ts: meta?.date instanceof Date ? meta.date.toISOString() : new Date().toISOString(),
            level: meta?.logLevelName,
            logger: meta?.loggerName,
            ...logObj, // includes your payload; keep _meta if you want full fidelity
        });
        stream.write(line + "\n");
    });
}

/** ---------- express middleware ---------- */
export function requestLogger() {
    return function (req: Request, res: Response, next: NextFunction) {
        const start = Date.now();
        res.on("finish", () => {
            const durationMs = Date.now() - start;
            log.info("http", {
                method: req.method,
                path: req.originalUrl || req.url,
                status: res.statusCode,
                durationMs,
                ip: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress,
            });
        });
        next();
    };
}

export function errorLogger() {
    return function (err: unknown, req: Request, res: Response, _next: NextFunction) {
        const status = (res.statusCode >= 400 && res.statusCode) || 500;
        log.error(
            err instanceof Error ? { msg: err.message, stack: err.stack } : { msg: String(err) },
            {
                method: req.method,
                path: req.originalUrl || req.url,
                status,
            }
        );
        if (!res.headersSent) {
            res.status(status).json({ error: "Internal Server Error" });
        }
    };
}
