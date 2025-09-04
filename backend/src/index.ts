// backend/src/index.ts

import express from "express";
import path from "path";
import fs from "fs";
import http from "http";
import https from "https";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";
import registrationRoutes from "./routes/registration";
import {log, requestLogger, errorLogger} from "@/utils/logger";
import {requireProxySeal} from "@/utils/auth";

const app = express();
const host = process.env.BIND_HOST || "0.0.0.0";
const port = Number(process.env.BACKEND_PORT || 8080);
const httpsEnabled = process.env.HTTPS === "true";
const certPath = process.env.HTTPS_CERT || "/certs/localhost.pem";
const keyPath  = process.env.HTTPS_KEY  || "/certs/localhost-key.pem";

// 1) Core middleware
app.set("trust proxy", 1); // if behind a proxy now or later
app.use(express.json());
app.use(compression());
app.use(cookieParser());
const uiOrigin = process.env.UI_ORIGIN;
app.use(cors(uiOrigin ? {
    origin: uiOrigin,
    credentials: true,
    methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","x-csrf-token"],
} : { origin: false }));
app.use(requestLogger());
app.use(requireProxySeal);

// 2) Security headers (tune CSP as needed)
app.use(helmet({
    // example CSP; adjust for your app (fonts, APIs, analytics, etc.)
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? {
        useDefaults: true,
        directives: {
            "default-src": ["'self'"],
            "img-src": ["'self'", "data:"],
            "style-src": ["'self'", "'unsafe-inline'"],
            "script-src": ["'self'"],
            "connect-src": ["'self'", "/api"],
        }
    } : false, // disable CSP in dev to avoid HMR headaches
    crossOriginEmbedderPolicy: false,
}));

// 3) API first
app.use("/api/registrations", registrationRoutes);

// 4) Serve frontend build in production
if (process.env.NODE_ENV === "production") {
    const clientDir = path.resolve(process.cwd(), "../frontend/dist");

    // Static assets: long cache
    app.use(express.static(clientDir, {
        setHeaders(res, filePath) {
            if (/\.(js|css|woff2?|png|jpg|svg)$/.test(filePath)) {
                res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            }
        }
    }));

    // SPA fallback: no-cache for index.html
    app.get("*", (_req, res) => {
        res.setHeader("Cache-Control", "no-store");
        res.sendFile(path.join(clientDir, "index.html"));
    });
}

// 5) Error logging
app.use(errorLogger());

// 6) Start
const server = httpsEnabled
    ? https.createServer({ key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }, app)
    : http.createServer(app);

server.listen(port, host, () => {
    log.info("Server listening", {protocol: httpsEnabled ? "https" : "http", host, port});
});

function shutdown(signal: string) {
    log.info("Server shutting down", {signal});
    server.close(() => {
        log.info("Server closed");
        process.exit(0);
    });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
