// backend/src/utils/logger.ts
//

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import type { NextFunction, Request, Response } from "express";
import { type ILogObj, Logger as TsLogger } from "tslog";

dotenv.config();

/** --- env & paths --- */
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

/** --- logger (pretty console) --- */
export const log = new TsLogger<ILogObj>({
    name: LOG_PREFIX,
    minLevel,
    type: "pretty", // pretty console output
});

/** --- helper: normalize tslog transport payload --- */
function normalizePayload(logObj: any) {
    const meta = logObj?._meta ?? {};

    // Numeric keys are positional args: { "0": "msg", "1": {...}, _meta: {...} }
    const argKeys = Object.keys(logObj).filter((k) => k !== "_meta");
    const numericArgKeys = argKeys
        .filter((k) => /^\d+$/.test(k))
        .sort((a, b) => Number(a) - Number(b));
    const namedKeys = argKeys.filter((k) => !/^\d+$/.test(k));

    const args = numericArgKeys.map((k) => logObj[k]);
    const named: Record<string, unknown> = {};
    for (const k of namedKeys) named[k] = logObj[k];

    // Derive message: prefer first string arg, else named.msg, else stringify first arg
    let msg = "";
    if (typeof args[0] === "string") {
        msg = args[0];
    } else if (typeof (named as any).msg === "string") {
        msg = String((named as any).msg);
    } else if (args[0] != null) {
        msg = typeof args[0] === "object" ? JSON.stringify(args[0]) : String(args[0]);
    }

    // Remaining args → fields
    const fields: Record<string, unknown> = { ...named };
    for (let i = 1; i < args.length; i++) fields[`arg${i}`] = args[i];

    // Flatten Error objects for readability
    for (const [k, v] of Object.entries(fields)) {
        if (v instanceof Error) {
            fields[k] = { message: v.message, stack: v.stack };
        }
    }

    return { meta, msg, fields };
}

/** --- helper: format a single line for file transport --- */
function formatLine(logObj: unknown): string {
    const { meta, msg, fields } = normalizePayload(logObj as any);

    const dt = meta?.date instanceof Date ? meta.date : new Date();
    const ts = new Date(dt instanceof Date ? dt.getTime() : Date.now())
        .toISOString()
        .replace("T", " ")
        .replace("Z", "");

    const level = String(meta?.logLevelName || "info").toUpperCase().padEnd(5);
    const loggerName = meta?.loggerName || LOG_PREFIX;

    const parts: string[] = [];
    if (msg) parts.push(msg);
    for (const [k, v] of Object.entries(fields)) {
        const val =
            typeof v === "string"
                ? JSON.stringify(v)
                : v && typeof v === "object"
                    ? JSON.stringify(v)
                    : String(v);
        if (k !== "msg") parts.push(`${k}=${val}`);
    }

    return `[${ts}] ${level} ${loggerName} ${parts.join(" ")}`.trim();
}

/** --- optional file transport (human-readable lines, appended) --- */
let fileStream: fs.WriteStream | undefined;

if (LOG_TO_FILE) {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    const logFilePath = path.join(LOG_DIR, `${LOG_PREFIX}.log`);
    fileStream = fs.createWriteStream(logFilePath, { flags: "a" }); // append mode

    // Attach a transport that writes one formatted line per log call
    log.attachTransport((logObj) => {
        fileStream!.write(formatLine(logObj) + "\n");
    });

    // tidy shutdown
    const close = () => {
        try {
            fileStream?.end();
        } catch {
            // no-op
        }
    };
    process.on("beforeExit", close);
    process.on("SIGINT", () => {
        close();
        process.exit(0);
    });
}

/** --- express middleware --- */
export function requestLogger() {
    return function (req: Request, res: Response, next: NextFunction) {
        const start = Date.now();
        res.on("finish", () => {
            const durationMs = Date.now() - start;
            log.info({
                msg: "http",
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
        log.error({
            msg: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
            method: req.method,
            path: req.originalUrl || req.url,
            status,
        });
        if (!res.headersSent) {
            res.status(status).json({ error: "Internal Server Error" });
        }
    };
}

/** --- helper: log + send a standardized error response --- */
export function sendError(
    res: Response,
    status: number,
    message: string,
    context?: Record<string, unknown>
) {
    log.error({ msg: message, ...context });
    return res.status(status).json({ error: message });
}
