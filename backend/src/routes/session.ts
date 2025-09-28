// backend/src/routes/session.ts

import {Router, Request, Response} from "express";
import {clearSession, getSession} from "@/utils/auth";
import {log} from "@/utils/logger";

const router = Router();

router.post("/logout", (req: Request, res: Response) => {
    const session = getSession(req);
    if (session) {
        log.info("Session destroyed", {
            registrationId: session.registrationId,
            isOrganizer: session.isOrganizer,
        });
    }
    clearSession(req, res);
    res.json({ ok: true });
});

export default router;
