// backend/src/app.ts

import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";
import registrationRoutes from "./routes/registration";
import sessionRoutes from "./routes/session";
import validationTableRoutes from "./routes/validationTables";
import {errorLogger, requestLogger} from "@/utils/logger";
import {requireProxySeal} from "@/utils/auth";
import presentersRouter from "@/routes/presenters";
import configRouter from "@/routes/config";
import rsvpRouter from "@/routes/rsvp";

const app = express();

// 1) Core middleware
app.set("trust proxy", 1);
app.use(express.json({ limit: "8mb" }));
app.use(compression());
app.use(cookieParser());

const uiOrigin = process.env.UI_ORIGIN;
app.use(cors(uiOrigin ? {
    origin: uiOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ['Content-Type', 'x-csrf-token', 'X-CSRF-Token'],
} : { origin: false }));

// ---- Liveness probe: no auth, no proxy seal ----
app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.use(requestLogger());
app.use(requireProxySeal);

// 2) Security headers
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? {
        useDefaults: true,
        directives: {
            "default-src": ["'self'"],
            "img-src": ["'self'", "data:"],
            "style-src": ["'self'", "'unsafe-inline'"],
            "script-src": ["'self'"],
        }
    } : false,
    crossOriginEmbedderPolicy: false,
}));

// 3) API routes
app.use("/api/registrations", registrationRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/validation-tables", validationTableRoutes);
app.use("/api/presenters", presentersRouter);
app.use("/api/config", configRouter);
app.use("/api/rsvp", rsvpRouter);

// 4) Error logging
app.use(errorLogger());

export default app;   // default export
export { app };       // named export too
