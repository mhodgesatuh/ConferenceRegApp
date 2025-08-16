// backend/src/utils/logger.ts
//

import "dotenv/config"; // ensure env is loaded before reading process.env
import fs from "fs";
import path from "path";
import { Logger } from "tslog";
import type { Request, Response, NextFunction } from "express";

const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), "logs");
const LOG_TO_FILE = String(process.env.LOG_TO_FILE ?? "true").toLowerCase() === "true";
const LOG_PREFIX = process.env.LOG_PREFIX || "app";
const LOG_LEVEL = (process.env.LOG_LEVEL || "info").toLowerCase() as any;

export const log = new Logger({ name: "app", minLevel: LOG_LEVEL });

if (LOG_TO_FILE) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    const filePath = path.join(LOG_DIR, `${LOG_PREFIX}.log`);
    const stream = fs.createWriteStream(filePath, { flags: "a" });
    log.attachTransport((logObj) => {
        const ts = new Date(logObj.date.getTime()).toLocaleString("en-US", { timeZone: "Pacific/Honolulu" });
        stream.write(`[${ts}] ${logObj.logLevelName.padEnd(5)} ${logObj.loggerName || "app"} ${logObj.argumentsArray.map(a => {
            try { return typeof a === "string" ? a : JSON.stringify(a); } catch { return String(a); }
        }).join(" ")}\n`);
    });
}

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

export function sendError(res: Response, status: number, error: string, details?: Record<string, unknown>): void {
    res.status(status).json({ error, ...(details ?? {}) });
}
