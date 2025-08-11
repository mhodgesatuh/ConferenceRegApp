/**
 * backend/src/utils/logger.ts
 *
 * Quick start:
 * 1) Save this file as src/utils/logger.ts (or a path you prefer)
 * 2) Add to your code:
 *      import { log, requestLogger, errorLogger } from "./utils/logger";
 *      app.use(requestLogger());
 *      // your routes
 *      app.use(errorLogger());
 *      log.info("server started");
 * 3) In .env (dev):
 *      LOG_DIR=./logs
 *      LOG_LEVEL=info
 *      LOG_TO_FILE=true
 * 4) In production (container):
 *      LOG_DIR=/var/log/conference-reg
 *      LOG_LEVEL=info
 *      LOG_TO_FILE=true
 *      # mount LOG_DIR as a persistent volume
 *
 * Notes:
 * - Frontend (browser) apps cannot write files; use this on the server side.
 * - Logs always go to console. When LOG_TO_FILE=true, they also go to a file.
 * - File name rotates daily: <prefix>-YYYY-MM-DD.log (prefix defaults to "app").
 */

import fs from "fs";
import path from "path";
import { promises as fsp } from "fs";
import type { Request, Response, NextFunction } from "express";

// ---------- Configuration ----------
const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), "logs");
const LOG_LEVEL = (process.env.LOG_LEVEL || "info").toLowerCase() as LogLevelName;
const LOG_TO_FILE = String(process.env.LOG_TO_FILE || "true").toLowerCase() === "true";
const LOG_PREFIX = process.env.LOG_PREFIX || "app"; // file prefix

const LEVELS = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
} as const;

type LogLevelName = keyof typeof LEVELS;

// Ensure directory exists (sync on first import so early logs don't race)
try {
    if (LOG_TO_FILE && !fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }
} catch (e) {
    // Fall back to console-only if unable to create dir
    // eslint-disable-next-line no-console
    console.warn("logger: could not create LOG_DIR; file logging disabled:", e);
}

// ---------- Helpers ----------
function currentDateISO() {
    return new Date().toISOString();
}

function todayStamp() {
    const d = new Date();
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function filePathForToday() {
    return path.join(LOG_DIR, `${LOG_PREFIX}-${todayStamp()}.log`);
}

function toJSONSafe(value: unknown) {
    try {
        if (value instanceof Error) {
            return {
                name: value.name,
                message: value.message,
                stack: value.stack,
            };
        }
        return typeof value === "string" ? value : JSON.parse(JSON.stringify(value));
    } catch {
        return String(value);
    }
}

function formatLine(level: LogLevelName, msg: unknown, context?: Record<string, unknown>) {
    const base = {
        ts: currentDateISO(),
        level,
        msg: typeof msg === "string" ? msg : toJSONSafe(msg),
        ...(context ? { context: toJSONSafe(context) } : {}),
    };
    // One-line JSON for easy shipping to log processors
    return JSON.stringify(base) + "\n";
}

async function writeFileLine(line: string) {
    try {
        await fsp.appendFile(filePathForToday(), line, "utf8");
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("logger: failed to write log file:", e);
    }
}

function shouldLog(level: LogLevelName) {
    return LEVELS[level] >= LEVELS[LOG_LEVEL];
}

function consoleWrite(level: LogLevelName, line: string) {
    const plain = JSON.parse(line) as { ts: string; level: string; msg: unknown; context?: unknown };
    const prefix = `[${plain.ts}] ${plain.level.toUpperCase()}:`;
    const payload = typeof plain.msg === "string" ? plain.msg : JSON.stringify(plain.msg);
    const ctx = plain.context ? ` ${JSON.stringify(plain.context)}` : "";
    if (level === "error") {
        // eslint-disable-next-line no-console
        console.error(prefix, payload + ctx);
    } else if (level === "warn") {
        // eslint-disable-next-line no-console
        console.warn(prefix, payload + ctx);
    } else {
        // eslint-disable-next-line no-console
        console.log(prefix, payload + ctx);
    }
}

// ---------- Public API ----------
export const log = {
    debug(msg: unknown, context?: Record<string, unknown>) {
        if (!shouldLog("debug")) return;
        const line = formatLine("debug", msg, context);
        consoleWrite("debug", line);
        if (LOG_TO_FILE) void writeFileLine(line);
    },
    info(msg: unknown, context?: Record<string, unknown>) {
        if (!shouldLog("info")) return;
        const line = formatLine("info", msg, context);
        consoleWrite("info", line);
        if (LOG_TO_FILE) void writeFileLine(line);
    },
    warn(msg: unknown, context?: Record<string, unknown>) {
        if (!shouldLog("warn")) return;
        const line = formatLine("warn", msg, context);
        consoleWrite("warn", line);
        if (LOG_TO_FILE) void writeFileLine(line);
    },
    error(msg: unknown, context?: Record<string, unknown>) {
        if (!shouldLog("error")) return;
        const line = formatLine("error", msg, context);
        consoleWrite("error", line);
        if (LOG_TO_FILE) void writeFileLine(line);
    },
};

// ---------- Express helpers (optional) ----------
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return function (err: unknown, req: Request, res: Response, _next: NextFunction) {
        const status = (res.statusCode >= 400 && res.statusCode) || 500;
        log.error(err instanceof Error ? err : String(err), {
            method: req.method,
            path: req.originalUrl || req.url,
            status,
        });
        if (!res.headersSent) {
            res.status(status).json({ error: "Internal Server Error" });
        }
    };
}

// ---------- Type helpers ----------
export type Logger = typeof log;
