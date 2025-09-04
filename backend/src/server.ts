// backend/src/server.ts

import fs from "fs";
import http from "http";
import https from "https";
import path from "path";
import app from "./app";
import { log } from "@/utils/logger";

const host = process.env.BIND_HOST || "0.0.0.0";
const port = Number(process.env.BACKEND_PORT || 8080);
const httpsEnabled = process.env.HTTPS === "true";
const certPath = process.env.HTTPS_CERT || "/certs/localhost.pem";
const keyPath  = process.env.HTTPS_KEY  || "/certs/localhost-key.pem";

const server = httpsEnabled
    ? https.createServer({ key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }, app)
    : http.createServer(app);

server.listen(port, host, () => {
    log.info("Server listening", { protocol: httpsEnabled ? "https" : "http", host, port });
});

function shutdown(signal: string) {
    log.info("Server shutting down", { signal });
    server.close(() => {
        log.info("Server closed");
        process.exit(0);
    });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
