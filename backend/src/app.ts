// backend/src/app.ts

import express from "express";
import path from "path";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";
import registrationRoutes from "./routes/registration";
import { log, requestLogger, errorLogger } from "@/utils/logger";
import { requireProxySeal } from "@/utils/auth";

const app = express();

// 1) Core middleware
app.set("trust proxy", 1);
app.use(express.json());
app.use(compression());
app.use(cookieParser());

const uiOrigin = process.env.UI_ORIGIN;
app.use(cors(uiOrigin ? {
    origin: uiOrigin,
    credentials: true,
    methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
    allowedHeaders: ['Content-Type', 'x-csrf-token', 'X-CSRF-Token'],
} : { origin: false }));

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
            "connect-src": ["'self'", "/api"],
        }
    } : false,
    crossOriginEmbedderPolicy: false,
}));

// 3) API routes
app.use("/api/registrations", registrationRoutes);

// 4) Error logging
app.use(errorLogger());

export default app;
