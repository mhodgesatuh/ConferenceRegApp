// backend/src/routes/validationTables.ts

import {Request, Response, Router} from "express";
import {asc, eq} from "drizzle-orm";

import {db} from "@/db/client";
import {validationTables} from "@/db/schema";
import {log, sendError} from "@/utils/logger";
import {logDbError} from "@/utils/dbErrorLogger";

const router = Router();

router.get("/:table", async (req: Request, res: Response) => {
    const table = String(req.params.table ?? "").trim();
    if (!table) {
        sendError(res, 400, "validation_table_required");
        return;
    }

    try {
        const rows = await db
            .select()
            .from(validationTables)
            .where(eq(validationTables.validationTable, table))
            .orderBy(asc(validationTables.value));

        res.json({
            values: rows.map((row) => row.value),
        });
    } catch (err) {
        logDbError(log, err, {
            message: "Failed to load validation table",
            table,
        });
        sendError(res, 500, "Failed to load validation table");
    }
});

export default router;
