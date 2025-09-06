// src/types/express-auth.d.ts

import "express";

declare module "express-serve-static-core" {
    interface Request {
        registrationId?: number;
    }
}
