// backend/src/utils/logger.ts
//

import {Logger} from "tslog";
import fs from "fs";
import path from "path";
import type {NextFunction, Request, Response} from "express";

const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), "logs");
const LOG_PREFIX = process.env.LOG_PREFIX || "app";

fs.mkdirSync(LOG_DIR, {recursive: true});
const filePath = path.join(LOG_DIR, `${LOG_PREFIX}.log`);
const stream = fs.createWriteStream(filePath, {flags: "a"});

const levelMap = {silly: 0, trace: 1, debug: 2, info: 3, warn: 4, error: 5, fatal: 6} as const;
type LevelName = keyof typeof levelMap;
const LOG_LEVEL = ((process.env.LOG_LEVEL || "debug").toLowerCase() as LevelName);
const MIN_LEVEL = levelMap[LOG_LEVEL] ?? levelMap.debug;

export const log = new Logger({name: "app", minLevel: MIN_LEVEL});

log.attachTransport((raw: unknown) => {
    const o = raw as {
        date?: unknown;
        logLevelName?: string;
        loggerName?: string;
        argumentsArray?: unknown[];
    };

    const d = o?.date instanceof Date
        ? o.date
        : (typeof o?.date === "string" || typeof o?.date === "number")
            ? new Date(o.date)
            : new Date();

    const ts = d.toLocaleString("en-US", {
        timeZone: "Pacific/Honolulu",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false
    });

    const level = String(o?.logLevelName ?? "").toUpperCase().padEnd(5);
    const logger = o?.loggerName ?? "app";
    const msg = (o?.argumentsArray ?? []).map(a => {
        if (typeof a === "string") return a;
        try {
            return JSON.stringify(a);
        } catch {
            return String(a);
        }
    }).join(" ");

    stream.write(`[${ts}] ${level} ${logger} ${msg}\n`);
});

export function requestLogger() {
    return (req: Request, _res: Response, next: NextFunction) => {
        log.info("HTTP", {method: req.method, path: req.originalUrl});
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
        res.status(500).json({error: "Internal server error"});
    };
}

export function sendError(
    res: Response,
    status: number,
    error: string,
    details?: Record<string, unknown>
) {
    res.status(status).json({error, ...(details ?? {})});
}
