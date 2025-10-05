// backend/src/routes/config.ts

import { Router } from "express";
import { getPresenterMaxBytes } from "@/constants/presenters";

const router = Router();

router.get("/", (_req, res) => {
    res.json({ presenterMaxBytes: getPresenterMaxBytes() });
});

export default router;

