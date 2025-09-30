// backend/src/routes/validationTables.ts

import {Request, Response, Router} from "express";
import {asc, eq} from "drizzle-orm";

import {db} from "@/db/client";
import {validationTables} from "@/db/schema";
import {log, sendError} from "@/utils/logger";
import {logDbError} from "@/utils/dbErrorLogger";

const router = Router();

function toSnake(s: string): string {
    return s
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[-\s]+/g, '_')
        .toLowerCase();
}

router.get("/:table", async (req: Request, res: Response) => {
    const raw = String(req.params.table ?? "").trim();
    const table = toSnake(raw);
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
            table, // normalized
        });
        sendError(res, 500, "Failed to load validation table");
    }
});

export default router;
