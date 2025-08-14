import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import type { Request, Response, NextFunction } from "express";
import { Logger as TsLogger, TLogLevelName } from "tslog";

dotenv.config();

const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), "logs");
const LOG_LEVEL: TLogLevelName = (process.env.LOG_LEVEL as TLogLevelName) || "info";
const LOG_TO_FILE = String(process.env.LOG_TO_FILE || "true").toLowerCase() === "true";
const LOG_PREFIX = process.env.LOG_PREFIX || "app";

if (LOG_TO_FILE && !fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logFilePath = path.join(LOG_DIR, `${LOG_PREFIX}.log`);

export const log: TsLogger = new TsLogger({ minLevel: LOG_LEVEL });

if (LOG_TO_FILE) {
    log.attachTransport((logObj, logMeta) => {
        const line = JSON.stringify({
            ts: logMeta.date.toISOString(),
            level: logMeta.logLevelName,
            ...logObj,
        });
        try {
            fs.appendFileSync(logFilePath, line + "\n");
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn("logger: failed to write log file:", err);
        }
    }, LOG_LEVEL);
}

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

export type Logger = typeof log;
